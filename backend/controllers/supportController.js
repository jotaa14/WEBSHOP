const SupportTicket = require('../models/SupportTicket');
const { logActivity } = require('../utils/logger');

// User actions
const showSupportForm = async (req, res) => {
  try {
    const myTickets = await SupportTicket.find({ user: req.session.user.id }).sort({ createdAt: -1 });
    res.render('support/index', { myTickets, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.send('Erro ao abrir suporte.');
  }
};

const createTicket = async (req, res) => {
  try {
    const { subject, description } = req.body;
    if (!subject || !description) return res.send('Preenche todos os campos.');

    await SupportTicket.create({
      user: req.session.user.id,
      userName: req.session.user.name,
      userEmail: req.session.user.email,
      userRole: req.session.user.role,
      subject,
      description
    });

    await logActivity(req, 'SUPPORT_TICKET_CREATE', `Criou um ticket de suporte: ${subject}`, { subject });

    res.redirect('/support');
  } catch (error) {
    console.error(error);
    res.send('Erro ao criar ticket de suporte.');
  }
};

const resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolved, userReply } = req.body; // 'yes' or 'no'

    const ticket = await SupportTicket.findOne({ _id: id, user: req.session.user.id });
    if (!ticket) return res.send('Ticket não encontrado.');

    if (resolved === 'yes') {
      ticket.status = 'closed';
      ticket.isResolved = true;
    } else {
      ticket.status = 'opened';
      ticket.isResolved = false;
      if (userReply && userReply.trim()) {
        ticket.messages.push({ sender: 'user', text: userReply.trim() });
      }
    }

    await ticket.save();
    res.redirect('/support');
  } catch (error) {
    console.error(error);
    res.send('Erro ao atualizar estado do ticket.');
  }
};

// Admin actions
const listAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ status: -1, createdAt: -1 });
    res.render('admin/support-tickets', { tickets });
  } catch (error) {
    console.error(error);
    res.send('Erro ao listar tickets.');
  }
};

const replyTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.send('Ticket não encontrado.');

    ticket.messages.push({ sender: 'admin', text: adminReply.trim() });
    await ticket.save();

    await logActivity(req, 'SUPPORT_TICKET_REPLY', `Respondeu ao ticket #${id}`, { ticketId: id });

    res.redirect('/admin/support-tickets');
  } catch (error) {
    console.error(error);
    res.send('Erro ao responder ao ticket.');
  }
};

const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.send('Ticket não encontrado.');

    ticket.status = 'cancelled';
    await ticket.save();

    await logActivity(req, 'SUPPORT_TICKET_CANCEL', `Cancelou o ticket #${id}`, { ticketId: id });

    res.redirect('/admin/support-tickets');
  } catch (error) {
    console.error(error);
    res.send('Erro ao cancelar ticket.');
  }
};

module.exports = {
  showSupportForm,
  createTicket,
  resolveTicket,
  listAllTickets,
  replyTicket,
  cancelTicket
};
