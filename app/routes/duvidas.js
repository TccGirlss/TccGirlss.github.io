const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");

module.exports = function (app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post("/enviar-duvida", async function (req, res) {
    const { pergunta } = req.body;
    const usuario = req.session?.usuario;

    if (!pergunta) {
      return res.status(400).send("Campo de pergunta vazio.");
    }

    if (!usuario) {
      return res.status(401).send("Usuário não autenticado.");
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "girlslly.womans.world@gmail.com",
          pass: "jywsirijcwrrsawg",
        },
      });

      const mailOptions = {
        from: `"Girlslly" <girlslly.womans.world@gmail.com>`,
        to: "girlslly.womans.world@gmail.com",
        subject: "📩 Nova dúvida enviada no site Girlslly",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 16px; background: #fff9b7; border-radius: 10px;">
            <h2 style="color: #7c6cff;">💬 Nova dúvida enviada pelo site Girlslly</h2>
            <p><strong>Email do usuário:</strong> ${usuario.email}</p>
            <p><strong>Pergunta:</strong> ${pergunta}</p>
            <hr style="border:none; border-top:1px solid #eee; margin:16px 0;">
            <p style="font-size: 13px; color: #666;">Enviado automaticamente pelo formulário de Dúvidas Frequentes.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      console.log(`Dúvida enviada por ${usuario.email}:`, pergunta);
      res.status(200).send("Dúvida enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      res.status(500).send("Erro ao enviar o e-mail.");
    }
  });
};
console.log("✅ Rota /enviar-duvida carregada");
