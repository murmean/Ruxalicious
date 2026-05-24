const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// LOG request general
app.use((req, res, next) => {
    console.log(`➡️ ${req.method} ${req.url}`);
    console.log("Body:", req.body);
    next();
});

const FILE = "appointments.json";

if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
    console.log("📁 appointments.json creat");
}

function getAppointments() {
    try {
        const data = fs.readFileSync(FILE, "utf8");
        console.log("📥 Citire appointments:", data);
        return JSON.parse(data);
    } catch (e) {
        console.log("❌ Eroare citire file:", e);
        return [];
    }
}

function saveAppointments(data) {
    try {
        fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
        console.log("💾 Salvate appointments:", data);
    } catch (e) {
        console.log("❌ Eroare salvare file:", e);
    }
}

function isSlotTaken(date, time) {
    const data = getAppointments();
    const taken = data.some(a => a.date === date && a.time === time);
    console.log(`⏰ Slot check ${date} ${time} =>`, taken);
    return taken;
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "ratiumarianalexandru@gmail.com",
        pass: "Futinlol321@"
    }
});

// test conexiune mail
transporter.verify((err, success) => {
    if (err) {
        console.log("❌ Mailer error:", err);
    } else {
        console.log("📧 Mailer ready");
    }
});

function sendEmail(booking) {
    console.log("📨 Trimit email pentru:", booking);

    transporter.sendMail({
        from: "Salon Unghii <ratiumarianalexandr@gmail.com>",
        to: "ratiumarianalexandru@gmail.com",
        subject: "Programare nouă 💅",
        text: `
Nume: ${booking.name}
Telefon: ${booking.phone}
Data: ${booking.date}
Ora: ${booking.time}
`
    }, (err, info) => {
        if (err) {
            console.log("❌ Email fail:", err);
        } else {
            console.log("✅ Email trimis:", info.response);
        }
    });
}

app.post("/book", (req, res) => {
    console.log("🔥 REQUEST /book primit");

    const { name, phone, date, time } = req.body;

    console.log("📦 Date extrase:", { name, phone, date, time });

    if (!name || !phone || !date || !time) {
        console.log("⚠️ Câmpuri lipsă");
        return res.status(400).json({ message: "Completează toate câmpurile" });
    }

    if (isSlotTaken(date, time)) {
        console.log("⛔ Slot ocupat");
        return res.status(400).json({ message: "Ora este ocupată" });
    }

    const appointments = getAppointments();

    const booking = {
        id: Date.now(),
        name,
        phone,
        date,
        time
    };

    appointments.push(booking);
    saveAppointments(appointments);

    sendEmail(booking);

    console.log("✅ Booking finalizat");

    res.json({ message: "Programare făcută 💅" });
});

app.get("/appointments", (req, res) => {
    console.log("📋 GET /appointments");
    res.json(getAppointments());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("🚀 Server pornit pe port " + PORT);
});