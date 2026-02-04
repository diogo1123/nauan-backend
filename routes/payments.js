
import express from 'express';
import { createPixPayment, getPaymentStatus } from '../services/mercadoPagoService.js';

export const router = express.Router();

// Criar novo pagamento Pix
router.post('/create-pix', async (req, res) => {
    try {
        const { amount, email, description, firstName, lastName } = req.body;

        if (!amount || !email) {
            return res.status(400).json({ error: 'Valor e email são obrigatórios.' });
        }

        const paymentData = await createPixPayment({
            amount,
            email,
            description: description || 'Reserva Nauan Beach Club',
            payerFirstName: firstName,
            payerLastName: lastName
        });

        res.status(201).json(paymentData);
    } catch (error) {
        console.error('Erro na rota /create-pix:', error);
        res.status(500).json({ error: 'Falha ao criar pagamento Pix' });
    }
});

// Consultar status
router.get('/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const status = await getPaymentStatus(id);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao consultar pagamento' });
    }
});

// Webhook para receber notificações automáticas do Mercado Pago
router.post('/webhook', async (req, res) => {
    const { type, data } = req.body;

    // O Mercado Pago envia um teste ao configurar
    if (type === 'test') {
        console.log('Webhook de teste recebido');
        return res.status(200).send('OK');
    }

    if (type === 'payment') {
        try {
            const paymentId = data.id;
            const status = await getPaymentStatus(paymentId);

            console.log(`Webhook: Pagamento ${paymentId} está ${status.status}`);

            if (status.status === 'approved') {
                // AQUI VOCÊ ADICIONARÁ A LÓGICA PARA CONFIRMAR A RESERVA NO BANCO DE DADOS
                // E DISPARAR O EMAIL DE CONFIRMAÇÃO
                console.log('>>> PAGAMENTO APROVADO! LIBERAR RESERVA <<<');
            }
        } catch (error) {
            console.error('Erro ao processar webhook:', error);
        }
    }

    res.status(200).send('OK');
});
