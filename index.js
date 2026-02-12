const express = require("express");
const cors = require("cors");
const axios = require("axios");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Clés API et config email
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

// Fonction pour calculer l’âge
function calculateAge(birthDateString) {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// 🔍 Route d’analyse médicale avec fallback
app.post("/analyze", async (req, res) => {
  const { name, bpm, temperature, spo2, birthDate, weight, history, emergency, address } = req.body;
  const age = calculateAge(birthDate);
  const language = req.headers["accept-language"] || "English";

  let AnswerInstruction;
  if (language == "en") AnswerInstruction = "Answer in English, clearly, directly, and reassuringly.";
  else if (language == "fr") AnswerInstruction = "Answer in French, clearly, directly, and reassuringly.";
  else if (language == "es") AnswerInstruction = "Answer in Kirundi, clearly, directly, and reassuringly.";
  else if (language == "sw") AnswerInstruction = "Answer in Swahili, clearly, directly, and reassuringly.";
  else if (language == "ru") AnswerInstruction = "Answer in igbo, clearly, directly, and reassuringly.";
  else if (language == "zh") AnswerInstruction = "Answer in haoussa, clearly, directly, and reassuringly.";
  else AnswerInstruction = "Answer clearly, directly, and reassuringly.";

  const prompt = `
You are a professional medical assistant AI.

Patient information:
- name: ${name}
- Age: ${age}
- Weight: ${weight} kg
- Medical History: ${history}
- Heart Rate (BPM): ${bpm}
- Body Temperature (°C): ${temperature}
- Oxygen Saturation (SpO₂): ${spo2}%

Your task is to:
1. Address ${name} directly using their first name.
2. Give simple and easy-to-understand advice (examples: "drink water," "rest," "go to the hospital," "call an ambulance," "lie on your side," etc.).
3. State whether their condition is normal, needs monitoring, or is critical.
4. If it is critical, clearly state that an ambulance must be called or they must go to the hospital.
5. Use simple language, without medical jargon, as if you were speaking to someone who is not a doctor.
6. Never end with a question or phrase like "can i help you any further?"or"Do you need something else"

${AnswerInstruction}
`;

  try {
    // 🔹 Essai avec IA en ligne (Groq)
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const analysis = response.data.choices[0].message.content.replace(/\*/g, "");
    res.json({ analysis });

    // 🔔 Envoi d’alerte si "critical"
    if (analysis.toLowerCase().includes("critical")) {
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: emergency,
        subject: "⚠️ Critical Medical Alert",
        text: `Critical condition detected for ${name}.\n\nAnalysis:\n${analysis}\n\nLocation: ${address || "Not available"}`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error("Email error:", error);
        else console.log("Alert email sent:", info.response);
      });
    }

  } catch (error) {
    console.error("Groq error:", error.message);

  }
});

// 🔮 Route de prédiction avec fallback
app.post("/predict", async (req, res) => {
  const { analysis } = req.body;
  if (!analysis) return res.status(400).json({ error: "Missing analysis text" });
   const language = req.headers["accept-language"] || "English";

  let AnswerInstruction;
  if (language == "en") AnswerInstruction = "Answer in English, clearly, directly, and reassuringly.";
  else if (language == "fr") AnswerInstruction = "Answer in French, clearly, directly, and reassuringly.";
  else if (language == "es") AnswerInstruction = "Answer in Kirundi, clearly, directly, and reassuringly.";
  else if (language == "sw") AnswerInstruction = "Answer in Swahili, clearly, directly, and reassuringly.";
  else if (language == "ru") AnswerInstruction = "Answer in igbo, clearly, directly, and reassuringly.";
  else if (language == "zh") AnswerInstruction = "Answer in haoussa, clearly, directly, and reassuringly.";
  else AnswerInstruction = "Answer clearly, directly, and reassuringly.";


  const prompt = `
You are a medical AI specialized in health risk prediction.

Here is a previous health analysis:
"${analysis}"

Predict if the person is at risk today. End with a preventive recommendation.
`;

  try {
    // 🔹 Essai avec IA en ligne (Groq)
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const prediction = response.data.choices[0].message.content.replace(/\*/g, "");
    res.json({ prediction });

  } catch (error) {
    console.error("Groq error:", error.message);
  }
});

// 🚀 Lancer le serveur
app.listen(3000, () => {
  console.log("Backend running at http://localhost:3000");
});