const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs').promises;

class CVServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.cvData = null;
        this.emailTransporter = null;
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Seguridad
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"]
                }
            }
        }));

        // CORS
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' ? false : true,
            credentials: true
        }));

        // Rate limiting para API
        const apiLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: 5, // máximo 5 requests por IP
            message: {
                error: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos.'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        this.app.use('/api/', apiLimiter);

        // Parsers
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Archivos estáticos
        this.app.use(express.static(path.resolve('dist')));
    }

    setupRoutes() {
        // Ruta principal
        this.app.get('/', (req, res) => {
            res.sendFile(path.resolve('dist/index.html'));
        });

        // API para obtener datos del CV
        this.app.get('/api/cv-data', async (req, res) => {
            try {
                if (!this.cvData) {
                    await this.loadCVData();
                }
                res.json(this.cvData);
            } catch (error) {
                console.error('Error cargando datos del CV:', error);
                res.status(500).json({ 
                    error: 'Error interno del servidor',
                    message: 'No se pudieron cargar los datos del CV'
                });
            }
        });

        // API para enviar formulario de contacto
        this.app.post('/api/contact', async (req, res) => {
            try {
                const { name, email, subject, message } = req.body;

                // Validar datos
                const validation = this.validateContactForm({ name, email, subject, message });
                if (!validation.isValid) {
                    return res.status(400).json({
                        error: 'Datos inválidos',
                        message: validation.message,
                        fields: validation.fields
                    });
                }

                // Cargar configuración de email si no está cargada
                if (!this.cvData) {
                    await this.loadCVData();
                }

                if (!this.emailTransporter) {
                    await this.setupEmailTransporter();
                }

                // Enviar email
                await this.sendContactEmail({ name, email, subject, message });

                res.json({
                    success: true,
                    message: 'Mensaje enviado correctamente'
                });

            } catch (error) {
                console.error('Error enviando email:', error);
                res.status(500).json({
                    error: 'Error enviando mensaje',
                    message: 'No se pudo enviar el mensaje. Por favor, intenta de nuevo.'
                });
            }
        });

        // API de salud del servidor
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // Manejo de rutas no encontradas
        this.app.get('*', (req, res) => {
            res.sendFile(path.resolve('dist/index.html'));
        });

        // Manejo de errores
        this.app.use(this.errorHandler.bind(this));
    }

    async loadCVData() {
        try {
            const dataPath = path.resolve('data/cv-data.json');
            const rawData = await fs.readFile(dataPath, 'utf8');
            this.cvData = JSON.parse(rawData);
            console.log('✅ Datos del CV cargados correctamente');
        } catch (error) {
            console.error('❌ Error cargando datos del CV:', error);
            throw error;
        }
    }

    async setupEmailTransporter() {
        if (!this.cvData || !this.cvData.contact) {
            throw new Error('Configuración de email no encontrada');
        }

        const { emailService } = this.cvData.contact;
        
        // Configuración para Gmail (puedes ajustar para otros proveedores)
        this.emailTransporter = nodemailer.createTransporter({
            host: emailService.host,
            port: emailService.port,
            secure: emailService.secure,
            auth: {
                user: process.env.EMAIL_USER || this.cvData.contact.emailRecipient,
                pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD
            }
        });

        // Verificar configuración
        try {
            await this.emailTransporter.verify();
            console.log('✅ Configuración de email verificada');
        } catch (error) {
            console.error('❌ Error en configuración de email:', error.message);
            console.log('💡 Asegúrate de configurar las variables de entorno EMAIL_USER y EMAIL_PASS');
            throw error;
        }
    }

    validateContactForm(data) {
        const { name, email, subject, message } = data;
        const errors = [];

        // Validar nombre
        if (!name || name.trim().length < 2) {
            errors.push({ field: 'name', message: 'El nombre debe tener al menos 2 caracteres' });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            errors.push({ field: 'email', message: 'Por favor, ingresa un email válido' });
        }

        // Validar asunto
        if (!subject || subject.trim().length < 3) {
            errors.push({ field: 'subject', message: 'El asunto debe tener al menos 3 caracteres' });
        }

        // Validar mensaje
        if (!message || message.trim().length < 10) {
            errors.push({ field: 'message', message: 'El mensaje debe tener al menos 10 caracteres' });
        }

        return {
            isValid: errors.length === 0,
            message: errors.length > 0 ? 'Por favor, corrige los errores en el formulario' : 'Datos válidos',
            fields: errors
        };
    }

    async sendContactEmail(data) {
        const { name, email, subject, message } = data;
        const recipientEmail = this.cvData.contact.emailRecipient;

        // Email para el destinatario
        const mailOptions = {
            from: `"${name}" <${process.env.EMAIL_USER || recipientEmail}>`,
            to: recipientEmail,
            subject: `[CV Online] ${subject}`,
            html: this.generateEmailTemplate(data),
            replyTo: email
        };

        // Email de confirmación para el remitente
        const confirmationMailOptions = {
            from: `"Jorge Eduardo Urdiales" <${process.env.EMAIL_USER || recipientEmail}>`,
            to: email,
            subject: 'Confirmación: Tu mensaje ha sido recibido',
            html: this.generateConfirmationTemplate(data)
        };

        try {
            // Enviar email principal
            await this.emailTransporter.sendMail(mailOptions);
            console.log(`✅ Email enviado desde ${name} (${email})`);

            // Enviar email de confirmación
            await this.emailTransporter.sendMail(confirmationMailOptions);
            console.log(`✅ Email de confirmación enviado a ${email}`);

        } catch (error) {
            console.error('❌ Error enviando emails:', error);
            throw error;
        }
    }

    generateEmailTemplate(data) {
        const { name, email, subject, message } = data;
        const timestamp = new Date().toLocaleString('es-MX');

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
                .footer { background: #1f2937; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
                .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; border-left: 4px solid #3b82f6; }
                .message-box { background: white; padding: 20px; border-radius: 4px; margin: 15px 0; border: 1px solid #e5e7eb; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Nuevo mensaje desde CV Online</h2>
                    <p style="margin: 0; opacity: 0.9;">Recibido el ${timestamp}</p>
                </div>
                
                <div class="content">
                    <div class="info-row">
                        <strong>Nombre:</strong> ${name}
                    </div>
                    <div class="info-row">
                        <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
                    </div>
                    <div class="info-row">
                        <strong>Asunto:</strong> ${subject}
                    </div>
                    
                    <div class="message-box">
                        <h3 style="margin-top: 0; color: #1f2937;">Mensaje:</h3>
                        <p style="white-space: pre-wrap; margin: 0;">${message}</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p style="margin: 0;">CV Online - Jorge Eduardo Urdiales Gonzalez</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateConfirmationTemplate(data) {
        const { name } = data;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
                .footer { background: #1f2937; color: white; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; }
                .success-icon { font-size: 48px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="success-icon">✅</div>
                    <h2>¡Mensaje Recibido!</h2>
                </div>
                
                <div class="content">
                    <p>Hola <strong>${name}</strong>,</p>
                    
                    <p>Gracias por contactarme a través de mi CV online. He recibido tu mensaje correctamente y te responderé lo antes posible.</p>
                    
                    <p>Normalmente respondo dentro de las próximas 24-48 horas. Si tu consulta es urgente, no dudes en contactarme directamente por teléfono.</p>
                    
                    <p>¡Que tengas un excelente día!</p>
                    
                    <p style="margin-top: 30px;">
                        Saludos cordiales,<br>
                        <strong>Jorge Eduardo Urdiales Gonzalez</strong><br>
                        Ingeniero en Desarrollo de Software
                    </p>
                </div>
                
                <div class="footer">
                    <p style="margin: 0;">Este es un email automático, por favor no responder a este mensaje.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    errorHandler(error, req, res, next) {
        console.error('❌ Error del servidor:', error);

        // Error de validación
        if (error.type === 'entity.parse.failed') {
            return res.status(400).json({
                error: 'Datos inválidos',
                message: 'El formato de los datos enviados no es válido'
            });
        }

        // Error de tamaño de payload
        if (error.type === 'entity.too.large') {
            return res.status(413).json({
                error: 'Payload demasiado grande',
                message: 'Los datos enviados exceden el límite permitido'
            });
        }

        // Error genérico
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Ha ocurrido un error inesperado'
        });
    }

    async start() {
        try {
            // Cargar datos del CV al iniciar
            await this.loadCVData();

            // Iniciar servidor
            this.app.listen(this.port, () => {
                console.log('🚀 Servidor iniciado correctamente');
                console.log(`🌐 URL: http://localhost:${this.port}`);
                console.log(`📧 Email configurado para: ${this.cvData?.contact?.emailRecipient || 'No configurado'}`);
                console.log('💡 Presiona Ctrl+C para detener el servidor');
            });

        } catch (error) {
            console.error('❌ Error iniciando el servidor:', error);
            process.exit(1);
        }
    }
}

// Iniciar servidor si es ejecutado directamente
if (require.main === module) {
    const port = process.env.PORT || 3000;
    const server = new CVServer(port);
    server.start();
}

module.exports = CVServer;