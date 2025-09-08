const fs = require('fs').promises;
const path = require('path');
const sass = require('sass');
const { exec } = require('child_process');
const { promisify } = require('util');
const chokidar = require('chokidar');

const execAsync = promisify(exec);

class CVBundler {
    constructor(options = {}) {
        this.options = {
            srcDir: path.resolve('src'),
            dataDir: path.resolve('data'),
            assetsDir: path.resolve('assets'),
            distDir: path.resolve('dist'),
            dev: options.dev || false,
            ...options
        };

        this.tasks = {
            html: this.processHTML.bind(this),
            styles: this.processStyles.bind(this),
            scripts: this.processScripts.bind(this),
            assets: this.processAssets.bind(this),
            data: this.processData.bind(this)
        };
    }

    async build() {
        console.log('🚀 Iniciando proceso de construcción...');
        const startTime = Date.now();

        try {
            // Crear directorio de salida
            await this.ensureDir(this.options.distDir);
            await this.ensureDir(path.join(this.options.distDir, 'data'));
            await this.ensureDir(path.join(this.options.distDir, 'assets'));

            // Ejecutar todas las tareas
            const tasks = Object.entries(this.tasks);
            for (const [name, task] of tasks) {
                console.log(`📦 Procesando ${name}...`);
                await task();
                console.log(`✅ ${name} procesado correctamente`);
            }

            const endTime = Date.now();
            console.log(`🎉 Construcción completada en ${endTime - startTime}ms`);

            if (this.options.dev) {
                this.startDevServer();
            }

        } catch (error) {
            console.error('❌ Error durante la construcción:', error);
            process.exit(1);
        }
    }

    async processHTML() {
        const htmlFiles = await this.getFiles(this.options.srcDir, '.html');
        
        for (const file of htmlFiles) {
            const content = await fs.readFile(file, 'utf8');
            const fileName = path.basename(file);
            const outputPath = path.join(this.options.distDir, fileName);
            
            // Procesar el HTML (minificar en producción)
            let processedContent = content;
            
            if (!this.options.dev) {
                processedContent = this.minifyHTML(content);
            }
            
            await fs.writeFile(outputPath, processedContent, 'utf8');
        }
    }

    async processStyles() {
        const scssFiles = await this.getFiles(this.options.srcDir, '.scss');
        const cssFiles = await this.getFiles(this.options.srcDir, '.css');
        
        // Procesar archivos SCSS
        for (const file of scssFiles) {
            const result = sass.compile(file, {
                style: this.options.dev ? 'expanded' : 'compressed',
                sourceMap: this.options.dev
            });
            
            const fileName = path.basename(file, '.scss') + '.css';
            const outputPath = path.join(this.options.distDir, fileName);
            
            await fs.writeFile(outputPath, result.css, 'utf8');
            
            if (this.options.dev && result.sourceMap) {
                await fs.writeFile(outputPath + '.map', JSON.stringify(result.sourceMap), 'utf8');
            }
        }
        
        // Procesar archivos CSS regulares
        for (const file of cssFiles) {
            const content = await fs.readFile(file, 'utf8');
            const fileName = path.basename(file);
            const outputPath = path.join(this.options.distDir, fileName);
            
            let processedContent = content;
            if (!this.options.dev) {
                processedContent = this.minifyCSS(content);
            }
            
            await fs.writeFile(outputPath, processedContent, 'utf8');
        }
    }

    async processScripts() {
        const tsFiles = await this.getFiles(this.options.srcDir, '.ts');
        const jsFiles = await this.getFiles(this.options.srcDir, '.js');
        
        // Procesar archivos TypeScript
        for (const file of tsFiles) {
            try {
                const fileName = path.basename(file, '.ts') + '.js';
                const outputPath = path.join(this.options.distDir, fileName);
                
                // Compilar TypeScript
                const command = `npx tsc "${file}" --outDir "${this.options.distDir}" --target es2017 --module es2015 --lib es2017,dom --strict --skipLibCheck`;
                await execAsync(command);
                
                console.log(`✅ TypeScript compilado: ${fileName}`);
            } catch (error) {
                console.error(`❌ Error compilando TypeScript ${file}:`, error.message);
                throw error;
            }
        }
        
        // Procesar archivos JavaScript regulares
        for (const file of jsFiles) {
            const content = await fs.readFile(file, 'utf8');
            const fileName = path.basename(file);
            const outputPath = path.join(this.options.distDir, fileName);
            
            let processedContent = content;
            if (!this.options.dev) {
                processedContent = this.minifyJS(content);
            }
            
            await fs.writeFile(outputPath, processedContent, 'utf8');
        }
    }

    async processAssets() {
        if (!await this.pathExists(this.options.assetsDir)) {
            console.log('📁 Creando directorio assets de ejemplo...');
            await this.ensureDir(this.options.assetsDir);
            await this.ensureDir(path.join(this.options.assetsDir, 'images'));
            
            // Crear imagen de placeholder
            const placeholderSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="300" height="300" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="300" fill="#e5e7eb"/>
    <circle cx="150" cy="120" r="40" fill="#9ca3af"/>
    <path d="M150 180 C120 180 90 200 90 220 L90 250 L210 250 L210 220 C210 200 180 180 150 180 Z" fill="#9ca3af"/>
    <text x="150" y="280" text-anchor="middle" fill="#6b7280" font-size="14" font-family="Arial">Foto de Perfil</text>
</svg>`;
            
            await fs.writeFile(
                path.join(this.options.assetsDir, 'images', 'profile.jpg'),
                placeholderSVG,
                'utf8'
            );
        }

        // Copiar todos los assets al directorio de salida
        const assetsOutputDir = path.join(this.options.distDir, 'assets');
        await this.ensureDir(assetsOutputDir);
        await this.copyDirectory(this.options.assetsDir, assetsOutputDir);
    }

    async processData() {
        if (!await this.pathExists(this.options.dataDir)) {
            console.log('📄 Directorio data no encontrado, saltando...');
            return;
        }

        const dataOutputDir = path.join(this.options.distDir, 'data');
        await this.ensureDir(dataOutputDir);
        await this.copyDirectory(this.options.dataDir, dataOutputDir);
    }

    // Métodos de utilidad
    async getFiles(dir, extension) {
        if (!await this.pathExists(dir)) return [];
        
        const files = await fs.readdir(dir, { withFileTypes: true });
        let result = [];
        
        for (const file of files) {
            const filePath = path.join(dir, file.name);
            
            if (file.isDirectory()) {
                const subFiles = await this.getFiles(filePath, extension);
                result = result.concat(subFiles);
            } else if (file.name.endsWith(extension)) {
                result.push(filePath);
            }
        }
        
        return result;
    }

    async ensureDir(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    async pathExists(path) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }

    async copyDirectory(src, dest) {
        await this.ensureDir(dest);
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    minifyHTML(html) {
        return html
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            .replace(/\s+>/g, '>')
            .replace(/<\s+/g, '<')
            .trim();
    }

    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .replace(/{\s*/g, '{')
            .replace(/;\s*/g, ';')
            .replace(/,\s*/g, ',')
            .replace(/:\s*/g, ':')
            .trim();
    }

    minifyJS(js) {
        // Minificación básica de JavaScript
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}();,:])\s*/g, '$1')
            .trim();
    }

    startDevServer() {
        console.log('👀 Iniciando modo de desarrollo...');
        console.log('🔍 Observando cambios en archivos...');
        
        // Configurar watchers
        const watchPaths = [
            this.options.srcDir,
            this.options.dataDir,
            this.options.assetsDir
        ].filter(p => fs.access(p).then(() => true).catch(() => false));

        const watcher = chokidar.watch(watchPaths, {
            ignored: /node_modules/,
            persistent: true
        });

        watcher.on('change', async (filePath) => {
            console.log(`🔄 Archivo modificado: ${filePath}`);
            
            try {
                const ext = path.extname(filePath);
                const dir = path.dirname(filePath);
                
                if (ext === '.html') {
                    await this.processHTML();
                    console.log('✅ HTML actualizado');
                } else if (ext === '.scss' || ext === '.css') {
                    await this.processStyles();
                    console.log('✅ Estilos actualizados');
                } else if (ext === '.ts' || ext === '.js') {
                    await this.processScripts();
                    console.log('✅ Scripts actualizados');
                } else if (dir.includes('assets')) {
                    await this.processAssets();
                    console.log('✅ Assets actualizados');
                } else if (dir.includes('data')) {
                    await this.processData();
                    console.log('✅ Datos actualizados');
                }
                
                console.log('🔥 Recarga tu navegador para ver los cambios');
            } catch (error) {
                console.error('❌ Error procesando cambio:', error.message);
            }
        });

        watcher.on('ready', () => {
            console.log('✅ Observador de archivos listo');
            console.log('💡 Abre dist/index.html en tu navegador');
            console.log('💡 Usa Ctrl+C para detener el observador');
        });
    }
}

// CLI
async function main() {
    const args = process.argv.slice(2);
    const isDev = args.includes('--dev') || args.includes('-d');
    
    const bundler = new CVBundler({ dev: isDev });
    await bundler.build();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = CVBundler;