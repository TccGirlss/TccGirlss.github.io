const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // ou smtp se quiser outro provedor
  auth: {
    user: "girlslly.womans.world@gmail.com",
    pass: "jywsirijcwrrsawg", // senha de app (não a senha real)
  },
});

async function enviarEmail(destinatario, assunto, html) {
  return transporter.sendMail({
    from: '"Girlslly" <girlslly.womans.world@gmail.com>',
    to: destinatario,
    subject: assunto,
    html,
  });
}

module.exports = { enviarEmail };
