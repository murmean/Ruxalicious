const express = require("express");
const fs = require("fs");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "appointments.json";

if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]");
}

function getAppointments() {
    return JSON.parse(fs.readFileSync(FILE));
}

function saveAppointments(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function isSlotTaken(date, time) {
    const data = getAppointments();
    return data.some(a => a.date === date && a.time === time);
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "EMAILUL_TAU@gmail.com",
        pass: "APP_PASSWORD"
    }
});

function sendEmail(booking) {
    transporter.sendMail({
        from: "Salon Unghii",
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

app.post("/book", (req, res) => {
    const { name, phone, date, time } = req.body;

    if (isSlotTaken(date, time)) {
        return res.status(400).json({ message: "Ora este ocupată" });
    }

    const data = getAppointments();

    const booking = {
        id: Date.now(),
        name,
        phone,
        date,
        time
    };

    data.push(booking);
    saveAppointments(data);

    sendEmail(booking);

    res.json({ message: "Programare făcută 💅" });
});

function getAppointments() {
    try {
        return JSON.parse(fs.readFileSync(FILE, "utf8"));
    } catch (e) {
        return [];
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server pornit"));