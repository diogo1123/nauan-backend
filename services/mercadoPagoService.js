
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configuração do Mercado Pago
// Substitua 'SEU_ACCESS_TOKEN' pelo seu Access Token de Produção ou Teste
// Você pode obter em: https://www.mercadopago.com.br/developers/panel
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || 'SEU_ACCESS_TOKEN_AQUI',
    options: { timeout: 5000 }
});

const payment = new Payment(client);

/**
 * Cria um pagamento via Pix
 * @param {Object} data - Dados do pagamento
 * @param {number} data.amount - Valor da transação
 * @param {string} data.email - Email do pagador
 * @param {string} data.description - Descrição do pedido (ex: "Reserva Bangalô")
 * @returns {Promise<Object>} - Retorna o objeto com QR Code e ID do pagamento
 */
export const createPixPayment = async ({ amount, email, description, payerFirstName, payerLastName }) => {
    try {
        const body = {
            transaction_amount: Number(amount),
            description: description,
            payment_method_id: 'pix',
            payer: {
                email: email,
                first_name: payerFirstName || 'Cliente',
                last_name: payerLastName || 'Nauan'
            },
            notification_url: 'https://seu-dominio.com/api/webhook/mercadopago' // URL que receberá o aviso de pagamento
        };

        const result = await payment.create({ body });

        return {
            id: result.id,
            status: result.status,
            qr_code: result.point_of_interaction.transaction_data.qr_code,
            qr_code_base64: result.point_of_interaction.transaction_data.qr_code_base64,
            ticket_url: result.point_of_interaction.transaction_data.ticket_url
        };
    } catch (error) {
        console.error('Erro ao criar Pix Mercado Pago:', error);
        throw error;
    }
};

/**
 * Verifica o status de um pagamento pelo ID
 * @param {string} paymentId 
 */
export const getPaymentStatus = async (paymentId) => {
    try {
        const result = await payment.get({ id: paymentId });
        return {
            id: result.id,
            status: result.status,
            status_detail: result.status_detail
        };
    } catch (error) {
        console.error('Erro ao consultar Pix Mercado Pago:', error);
        throw error;
    }
};
