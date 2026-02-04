
import nodemailer from 'nodemailer';

// Configuração para GMAIL
// IMPORTANTE: Para usar Gmail, você precisa gerar uma "Senha de App" (App Password).
// A senha normal do seu email NÃO vai funcionar.
// 1. Acesse sua conta Google > Segurança
// 2. Ative a "Verificação em duas etapas"
// 3. Procure por "Senhas de App", crie uma nova e cole abaixo.
const transporter = nodemailer.createTransport({
    service: 'gmail', // Simplifica a configuração para Gmail
    auth: {
        user: "diogoooalbuquerque@gmail.com",
        pass: "COLOQUE_SUA_SENHA_DE_APP_AQUI" // <--- NECESSÁRIO PREENCHER
    }
});

/**
 * Sends a booking confirmation email to the admin/staff.
 * @param {Object} booking - The booking details object.
 */
export const sendBookingNotification = async (booking) => {
    try {
        const {
            name,
            email,
            date,
            items = [],
            totalPrice,
            couponCode // Assuming this field exists in the booking object
        } = booking;

        const itemsList = items.map(item => `- ${item.name} (x${item.quantity})`).join('\n');

        const mailOptions = {
            from: '"Sistema de Reservas Nauan" <diogoooalbuquerque@gmail.com>',
            to: "diogoooalbuquerque@gmail.com", // Envia para você mesmo
            subject: `Nova Reserva Recebida! - ${name}`,
            text: `
NOVA RESERVA RECEBIDA

Cliente: ${name}
Email: ${email}
Data: ${date}

Itens Reservados:
${itemsList}

Cupom de Desconto: ${couponCode || 'Nenhum cupom aplicado'}

Valor Total: R$ ${totalPrice}

------------------------------------
Acesse o painel administrativo para mais detalhes.
            `,
            html: `
            <h2>NOVA RESERVA RECEBIDA</h2>
            <p><strong>Cliente:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Data:</strong> ${date}</p>
            
            <h3>Itens Reservados:</h3>
            <ul>
                ${items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join('')}
            </ul>

            <p><strong>Cupom de Desconto:</strong> ${couponCode ? `<span style="color: green; font-weight: bold;">${couponCode}</span>` : 'Nenhum cupom aplicado'}</p>

            <h3>Valor Total: R$ ${totalPrice}</h3>
            
            <hr>
            <p>Acesse o painel administrativo para mais detalhes.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email de notificação enviado: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Erro ao enviar email de notificação:", error);
        return false;
    }
};
