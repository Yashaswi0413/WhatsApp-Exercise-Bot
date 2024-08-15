const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const app = express();
const accountId = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.API_KEY;
const whatsapp = process.env.WHATS_APP

const twilioClient = twilio(accountId, authToken);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.post('/webhook', async (req, res) => {
    const from = req.body.From;
    const body = req.body.Body.trim().toLowerCase(); 

    const validMuscles = [
        'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest',
        'forearms', 'glutes', 'hamstrings', 'lats', 'lower_back', 'middle_back',
        'neck', 'quadriceps', 'traps', 'triceps'
    ];


    if (validMuscles.includes(body)) {
        try {
            const response = await axios.get(`https://api.api-ninjas.com/v1/exercises?muscle=${body}`, {
                headers: { 'X-Api-Key': apiKey }
            });

            const exercises = response.data;
            if (exercises.length === 0) {
                await twilioClient.messages.create({
                    body: `No exercises found for muscle group: ${body}.`,
                    from: whatsapp, 
                    to: from
                });
            } else {
                let replyMessage = `Here are some exercises for ${body}:\n\n`;
                exercises.forEach(exercise => {
                    replyMessage += `*Name:* ${exercise.name}\n`;
                    replyMessage += `*Type:* ${exercise.type}\n`;
                    replyMessage += `*Difficulty:* ${exercise.difficulty}\n`;
                    replyMessage += `*Equipment:* ${exercise.equipment}\n`;
                    replyMessage += `\n`;
                });

                await twilioClient.messages.create({
                    body: replyMessage,
                    from: whatsapp, 
                    to: from
                });
            }
        } catch (error) {
            console.error(error);
            await twilioClient.messages.create({
                body: 'An error occurred while fetching exercise data. Please try again later.',
                from: whatsapp, 
                to: from
            });
        }
    } else {

        const validMuscleList = validMuscles.join(', ');
        await twilioClient.messages.create({
            body: `Hi from the FitBot, please provide a valid muscle group. Possible values are: ${validMuscleList}.`,
            from: whatsapp, 
            to: from
        });
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
