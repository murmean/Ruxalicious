const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "appointments.json";

// creează fișierul dacă nu există
if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
}

// citire programări
function getAppointments() {
    try {
        return JSON.parse(fs.readFileSync(FILE, "utf8"));
    } catch (e) {
        return [];
    }
}

// salvare programări
function saveAppointments(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// verificare ore
function isSlotTaken(date, time) {
    const data = getAppointments();
    return data.some(a => a.date === date && a.time === time);
}

// email
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "EMAILUL_TAU@gmail.com",
        pass: "APP_PASSWORD"
    }
});

function sendEmail(booking) {
    transporter.sendMail({
        from: "Salon Unghii <EMAILUL_TAU@gmail.com>",
        to: "EMAILUL_TAU@gmail.com",
        subject: "Programare nouă 💅",
        text: `
Nume: ${booking.name}
Telefon: ${booking.phone}
Data: ${booking.date}
Ora: ${booking.time}
`
    });
}

// BOOKING API
app.post("/book", (req, res) => {
    const { name, phone, date, time } = req.body;

    if (!name || !phone || !date || !time) {
        return res.status(400).json({ message: "Completează toate câmpurile" });
    }

    if (isSlotTaken(date, time)) {
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

    res.json({ message: "Programare făcută 💅" });
});

// listă programări (test)
app.get("/appointments", (req, res) => {
    res.json(getAppointments());
});

// START SERVER (IMPORTANT PENTRU RENDER)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server pornit pe port " + PORT);
});