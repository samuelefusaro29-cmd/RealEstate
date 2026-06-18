import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ChatMessage {
    role: 'user' | 'bot';
    text: string;
}

@Component({
    selector: 'app-chatbot-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chatbot-widget.component.html',
    styleUrls: ['./chatbot-widget.component.css'],
})
export class ChatbotWidgetComponent implements AfterViewChecked, OnInit {
    @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

    private readonly chatUrl = `${environment.apiUrl}/chat`;

    isOpen    = false;
    isLoading = false;
    inputText = '';
    messages: ChatMessage[] = [
        { role: 'bot', text: 'Ciao! Sono HwBot, il tuo assistente immobiliare. Come posso aiutarti?' },
    ];

    bottomOffset = signal(24);
    private footer: HTMLElement | null = null;

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
        setTimeout(() => {
            this.footer = document.querySelector('footer');
            this.updateOffset();
        }, 0);
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    @HostListener('window:scroll')
    @HostListener('window:resize')
    updateOffset(): void {
        if (!this.footer) return;
        const visible = window.innerHeight - this.footer.getBoundingClientRect().top;
        this.bottomOffset.set(visible > 0 ? visible + 16 : 24);
    }

    toggleChat(): void {
        this.isOpen = !this.isOpen;
    }

    closeChat(): void {
        this.isOpen = false;
    }

    sendMessage(): void {
        const text = this.inputText.trim();
        if (!text || this.isLoading) return;

        this.messages.push({ role: 'user', text });
        this.inputText = '';
        this.isLoading = true;

        this.http.post<{ risposta: string }>(this.chatUrl, { domanda: text }).subscribe({
            next: (res) => {
                this.messages.push({ role: 'bot', text: res.risposta });
                this.isLoading = false;
            },
            error: () => {
                this.messages.push({ role: 'bot', text: 'Servizio momentaneamente non disponibile. Riprova tra poco.' });
                this.isLoading = false;
            },
        });
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    private scrollToBottom(): void {
        try {
            this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
        } catch {}
    }
}