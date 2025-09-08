// Interfaces
interface PersonalInfo {
    name: string;
    title: string;
    phone: string;
    email: string;
    linkedin: string;
    github: string;
    location: string;
    profileImage: string;
    summary: string;
}

interface Education {
    institution: string;
    degree: string;
    location: string;
    startDate: string;
    endDate: string;
    status: string;
}

interface Experience {
    position: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
}

interface Project {
    name: string;
    technologies: string[];
    startDate: string;
    endDate: string;
    description: string;
    highlights: string[];
    github?: string;
}

interface Skills {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    spoken: string[];
}

interface ContactInfo {
    emailRecipient: string;
    emailService: {
        host: string;
        port: number;
        secure: boolean;
    };
}

interface CVData {
    personalInfo: PersonalInfo;
    education: Education[];
    experience: Experience[];
    projects: Project[];
    skills: Skills;
    contact: ContactInfo;
}

// Estado global de la aplicación
class CVApp {
    private cvData: CVData | null = null;
    private loading: boolean = true;

    constructor() {
        this.init();
    }

    private async init(): Promise<void> {
        try {
            await this.loadCVData();
            this.render();
            this.setupEventListeners();
            this.hideLoading();
            this.setupAnimations();
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            this.showError('Error cargando los datos del CV');
        }
    }

    private async loadCVData(): Promise<void> {
        try {
            const response = await fetch('./data/cv-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.cvData = await response.json();
        } catch (error) {
            console.error('Error cargando datos del CV:', error);
            throw error;
        }
    }

    private render(): void {
        if (!this.cvData) return;

        this.renderPersonalInfo();
        this.renderEducation();
        this.renderSkills();
        this.renderExperience();
        this.renderProjects();
        this.renderContactInfo();
    }

    private renderPersonalInfo(): void {
        const { personalInfo } = this.cvData!;
        
        // Actualizar navegación
        document.getElementById('nav-name')!.textContent = personalInfo.name.split(' ')[0] + ' ' + personalInfo.name.split(' ')[personalInfo.name.split(' ').length - 1];
        
        // Actualizar hero section
        document.getElementById('hero-name')!.textContent = personalInfo.name;
        document.getElementById('hero-title')!.textContent = personalInfo.title;
        document.getElementById('hero-summary')!.textContent = personalInfo.summary;
        
        // Actualizar imagen de perfil
        const profileImg = document.getElementById('profile-image') as HTMLImageElement;
        profileImg.src = personalInfo.profileImage;
        profileImg.alt = `Foto de ${personalInfo.name}`;
        
        // Renderizar enlaces sociales
        const socialLinks = document.getElementById('social-links')!;
        socialLinks.innerHTML = `
            <a href="tel:${personalInfo.phone}" title="Teléfono">
                <i class="fas fa-phone"></i>
            </a>
            <a href="mailto:${personalInfo.email}" title="Email">
                <i class="fas fa-envelope"></i>
            </a>
            <a href="https://${personalInfo.linkedin}" target="_blank" title="LinkedIn">
                <i class="fab fa-linkedin"></i>
            </a>
            <a href="https://${personalInfo.github}" target="_blank" title="GitHub">
                <i class="fab fa-github"></i>
            </a>
        `;
    }

    private renderEducation(): void {
        const educationList = document.getElementById('education-list')!;
        const { education } = this.cvData!;
        
        educationList.innerHTML = education.map(edu => `
            <div class="education-item animate-fade-in-up">
                <h4>${edu.degree}</h4>
                <div class="institution">${edu.institution}</div>
                <div class="location">${edu.location}</div>
                <div class="dates">${edu.startDate} - ${edu.endDate}</div>
                <span class="status ${edu.status === 'En curso' ? 'current' : 'incomplete'}">
                    ${edu.status}
                </span>
            </div>
        `).join('');
    }

    private renderSkills(): void {
        const skillsContainer = document.getElementById('skills-container')!;
        const { skills } = this.cvData!;
        
        const skillCategories = [
            { name: 'Lenguajes de Programación', skills: skills.languages },
            { name: 'Frameworks', skills: skills.frameworks },
            { name: 'Bases de Datos', skills: skills.databases },
            { name: 'Herramientas', skills: skills.tools },
            { name: 'Idiomas', skills: skills.spoken }
        ];
        
        skillsContainer.innerHTML = skillCategories.map(category => `
            <div class="skill-category animate-fade-in-up">
                <h4>${category.name}</h4>
                <div class="skill-tags">
                    ${category.skills.map(skill => `
                        <span class="skill-tag">${skill}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    private renderExperience(): void {
        const experienceList = document.getElementById('experience-list')!;
        const { experience } = this.cvData!;
        
        experienceList.innerHTML = experience.map(exp => `
            <div class="timeline-item animate-fade-in-up">
                <div class="experience-card">
                    <h4>${exp.position}</h4>
                    <div class="company">${exp.company}</div>
                    <div class="location">${exp.location}</div>
                    <div class="dates">${exp.startDate} - ${exp.endDate}</div>
                    ${exp.current ? '<span class="current-badge">Actual</span>' : ''}
                    <div class="description">${exp.description}</div>
                </div>
            </div>
        `).join('');
    }

    private renderProjects(): void {
        const projectsGrid = document.getElementById('projects-grid')!;
        const { projects } = this.cvData!;
        
        projectsGrid.innerHTML = projects.map(project => `
            <div class="project-card animate-fade-in-up">
                <div class="project-header">
                    <h3>${project.name}</h3>
                    <div class="project-dates">${project.startDate} - ${project.endDate}</div>
                    <div class="project-description">${project.description}</div>
                </div>
                <div class="project-highlights">
                    <ul>
                        ${project.highlights.map(highlight => `
                            <li>${highlight}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="project-tech">
                    <div class="tech-tags">
                        ${project.technologies.map(tech => `
                            <span class="tech-tag">${tech}</span>
                        `).join('')}
                    </div>
                </div>
                ${project.github ? `
                    <div class="project-footer">
                        <a href="${project.github}" target="_blank" class="project-link">
                            <i class="fab fa-github"></i>
                            Ver en GitHub
                        </a>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    private renderContactInfo(): void {
        const contactDetails = document.getElementById('contact-details')!;
        const { personalInfo } = this.cvData!;
        
        contactDetails.innerHTML = `
            <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <a href="mailto:${personalInfo.email}">${personalInfo.email}</a>
            </div>
            <div class="contact-item">
                <i class="fas fa-phone"></i>
                <a href="tel:${personalInfo.phone}">${personalInfo.phone}</a>
            </div>
            <div class="contact-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${personalInfo.location}</span>
            </div>
            <div class="contact-item">
                <i class="fab fa-linkedin"></i>
                <a href="https://${personalInfo.linkedin}" target="_blank">LinkedIn</a>
            </div>
            <div class="contact-item">
                <i class="fab fa-github"></i>
                <a href="https://${personalInfo.github}" target="_blank">GitHub</a>
            </div>
        `;
    }

    private setupEventListeners(): void {
        // Navegación
        this.setupNavigation();
        
        // Formulario de contacto
        this.setupContactForm();
        
        // Descargar CV (placeholder)
        const downloadBtn = document.getElementById('download-cv');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Funcionalidad de descarga en desarrollo. Por ahora puedes usar Ctrl+P para imprimir.');
            });
        }
    }

    private setupNavigation(): void {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('section[id]');
        
        // Navegación por clicks
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href')?.substring(1);
                const targetSection = document.getElementById(targetId!);
                
                if (targetSection instanceof HTMLElement) {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
                
                // Actualizar clase activa
                navLinks.forEach(nl => nl.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // Navegación por scroll
        window.addEventListener('scroll', () => {
            let currentSection = '';
            
            sections.forEach(section => {
                if (section instanceof HTMLElement) {
                    const sectionTop = section.offsetTop - 100;
                    const sectionHeight = section.clientHeight;
                    
                    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                        currentSection = section.getAttribute('id') || '';
                    }
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        });
        
        // Toggle menú móvil
        const navToggle = document.querySelector('.nav-toggle');
        const navLinksContainer = document.querySelector('.nav-links');
        
        if (navToggle && navLinksContainer) {
            navToggle.addEventListener('click', () => {
                navLinksContainer.classList.toggle('active');
            });
        }
    }

    private setupContactForm(): void {
        const form = document.getElementById('contact-form') as HTMLFormElement;
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        const formMessage = document.getElementById('form-message') as HTMLElement;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) {
                return;
            }
            
            const formData = new FormData(form);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            try {
                this.setSubmitButtonLoading(true);
                
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    this.showFormMessage('¡Mensaje enviado correctamente! Te responderé pronto.', 'success');
                    form.reset();
                    this.clearFormErrors();
                } else {
                    throw new Error(result.message || 'Error enviando el mensaje');
                }
            } catch (error) {
                console.error('Error enviando formulario:', error);
                this.showFormMessage('Error enviando el mensaje. Por favor, intenta de nuevo.', 'error');
            } finally {
                this.setSubmitButtonLoading(false);
            }
        });
        
        // Validación en tiempo real
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input as HTMLInputElement | HTMLTextAreaElement);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input as HTMLInputElement | HTMLTextAreaElement);
            });
        });
    }

    private validateForm(): boolean {
        const form = document.getElementById('contact-form') as HTMLFormElement;
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input as HTMLInputElement | HTMLTextAreaElement)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    private validateField(field: HTMLInputElement | HTMLTextAreaElement): boolean {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';
        
        // Validación de campos requeridos
        if (field.required && !value) {
            isValid = false;
            errorMessage = 'Este campo es requerido';
        }
        
        // Validación específica por tipo
        if (value && fieldName === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Por favor, ingresa un email válido';
            }
        }
        
        if (value && fieldName === 'name') {
            if (value.length < 2) {
                isValid = false;
                errorMessage = 'El nombre debe tener al menos 2 caracteres';
            }
        }
        
        if (value && fieldName === 'message') {
            if (value.length < 10) {
                isValid = false;
                errorMessage = 'El mensaje debe tener al menos 10 caracteres';
            }
        }
        
        // Mostrar/ocultar errores
        if (isValid) {
            this.clearFieldError(field);
        } else {
            this.showFieldError(field, errorMessage);
        }
        
        return isValid;
    }

    private showFieldError(field: HTMLInputElement | HTMLTextAreaElement, message: string): void {
        field.classList.add('error');
        field.classList.remove('success');
        
        const errorElement = document.getElementById(`${field.name}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    private clearFieldError(field: HTMLInputElement | HTMLTextAreaElement): void {
        field.classList.remove('error');
        if (field.value.trim()) {
            field.classList.add('success');
        } else {
            field.classList.remove('success');
        }
        
        const errorElement = document.getElementById(`${field.name}-error`);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    private clearFormErrors(): void {
        const form = document.getElementById('contact-form') as HTMLFormElement;
        const inputs = form.querySelectorAll('input, textarea');
        const errorElements = form.querySelectorAll('.error-message');
        
        inputs.forEach(input => {
            input.classList.remove('error', 'success');
        });
        
        errorElements.forEach(error => {
            error.classList.remove('show');
        });
    }

    private setSubmitButtonLoading(loading: boolean): void {
        const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
        
        if (loading) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        } else {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    private showFormMessage(message: string, type: 'success' | 'error'): void {
        const formMessage = document.getElementById('form-message') as HTMLElement;
        
        formMessage.textContent = message;
        formMessage.className = `form-message ${type} show`;
        
        setTimeout(() => {
            formMessage.classList.remove('show');
        }, 5000);
    }

    private hideLoading(): void {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        this.loading = false;
    }

    private showError(message: string): void {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="text-align: center; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 0.5rem;
                        cursor: pointer;
                        margin-top: 1rem;
                    ">Reintentar</button>
                </div>
            `;
        }
    }

    private setupAnimations(): void {
        // Intersection Observer para animaciones
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observar elementos para animación
        setTimeout(() => {
            const animateElements = document.querySelectorAll('.education-item, .skill-category, .timeline-item, .project-card');
            animateElements.forEach(el => observer.observe(el));
        }, 100);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new CVApp();
});