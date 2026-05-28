const Activity = require('../models/Activity');

const logActivity = async (req, action, details, metadata = {}) => {
  try {
    if (!req.session.user) return;

    await Activity.create({
      user: req.session.user.id,
      userEmail: req.session.user.email || 'N/I', // Need to make sure email is in session
      userName: req.session.user.name,
      action,
      details,
      metadata
    });
  } catch (error) {
    console.error('Erro ao registar atividade:', error);
  }
};

module.exports = { logActivity };
