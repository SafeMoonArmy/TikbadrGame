// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
const backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
const connection = new TikTokIOConnection(backendUrl);

// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};

$(document).ready(() => {
    // Check if the current page is the main page (not obs.html)
    if (!location.href.includes('obs.html')) {
        // Main page logic
        $('#connectButton').click(connect);
        $('#uniqueIdInput').on('keyup', function (e) {
            if (e.key === 'Enter') {
                connect();
            }
        });

        if (window.settings.username) connect();
    } else {
        // OBS view logic
        // Add your OBS-specific logic here
        // For example, you might want to set up event listeners or perform OBS-specific actions
    }
});


function connect() {
    const enteredSerial = $('#serialInput').val();
    const maskedSerial = enteredSerial.replace(/./g, '*'); // Replace each character with an asterisk

    // Mask the serial in the input field
    $('#serialInput').val(maskedSerial);

    const validSerials = ['Badrtik2023Vip', 'badrvip2023', 'badrvip19' , 'badrvip20' , 'badrvip2024' , 'Badrvip2024']; // Add as many valid serial numbers as needed

    if (!validSerials.includes(enteredSerial)) {
        alert(`Numéro de série invalide. Veuillez entrer un numéro de série valide pour vous connecter. Entré : ${maskedSerial}`);
        return;
    }

    const uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {
        $('#stateText').text('Connexion en cours...');

        connection.connect(uniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#stateText').text(`Connecté à la salle`);

            // Reset statistics
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateRoomStats();

            // Hide the serial input field after connection
            $('#serialInputContainer').hide();

        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);

            // Schedule the next attempt if OBS username is defined
            if (window.settings.username) {
                setTimeout(() => {
                    connect(window.settings.username);
                }, 30000);
            }
        });

    } else {
        alert('Aucun nom d\'utilisateur saisi');
    }
}


// Prevent Cross-site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;');
}

function updateRoomStats() {
    $('#roomStats').html(`Viewers: <b>${viewerCount.toLocaleString()}</b> Likes: <b>${likeCount.toLocaleString()}</b> Earned Diamonds: <b>${diamondsCount.toLocaleString()}</b>`);
}

function generateUsernameLink(data) {
    return `${data.uniqueId}`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

function addChatItem(color, data, text, summarize) {
    const container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

    const isLikeStream = data.likedStream === true;
    const randomGlow = Math.random() < 0.5;
    const glowEffect = randomGlow ? 'glow-like-stream' : '';
    const glowEffectPicture = randomGlow ? 'glow-like-stream-picture' : '';

    // Get the ranking number and image size dynamically
    const rankingResult = getRankingNumber(data.uniqueId, userLikes[data.uniqueId].likes);
    const rankingNumberHtml = rankingResult.rankingNumberHtml;
    const imageSize = rankingResult.imageSize;

    // Calculate the top and left positions for centering the ranking number
    const topPosition = imageSize / 2 - 15; // Adjust 15 based on the font size and positioning
    const leftPosition = imageSize / 2;

    const profilePictureUrl = data.profilePictureUrl || 'default-profile-image.jpg'; // Replace 'default-profile-image.jpg' with a default image URL

    const message = $(`
        <div class=${summarize ? 'temporary' : 'static'} style="display: flex; align-items: center; justify-content: center; position: relative;">
            <div class="miniprofilepicture ${glowEffectPicture}" style="overflow: hidden; border-radius: 50%; ${isLikeStream ? 'animation: pulsate 1s infinite;' : ''}; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative;">
                <img src="${profilePictureUrl}" style="width: ${imageSize}px; height: ${imageSize}px;">
                <span class="profile-ranking neon bounce" style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); color: yellow; text-shadow: 0 0 10px yellow;">${rankingNumberHtml}</span>
            </div>
        </div>
    `);
    


    container.append(message);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}



function getRankingNumber(uniqueId, likes) {
    const topUsers = getTopUsers();
    const user = topUsers[uniqueId];

    if (user) {
        const userIndex = Object.keys(topUsers).indexOf(uniqueId);
        const rankingNumber = userIndex + 1;

        // Calculate the font size and profile picture size based on the number of likes
        const fontSize = 1.2 + 0.05 * likes; // You can adjust this multiplier as needed
        const imageSize = 50 + 1.5 * likes; // You can adjust this multiplier as needed

        // Make the ranking number green and adjust its font size
        const rankingNumberHtml = `<span style="color: yellow; font-size: ${fontSize}em; font-weight: bold;">${rankingNumber}</span>`;

        return {
            rankingNumberHtml,
            imageSize,
        };
    } else {
        return {
            rankingNumberHtml: '',
            imageSize: 50, // Default size if the user is not in the top 10
        };
    }
}

function getTopUsers() {
    // Sort the users based on the number of likes in descending order
    const sortedUsers = Object.entries(userLikes)
        .sort(([, a], [, b]) => b.likes - a.likes)
        .slice(0, 10); // Take the top 10 users

    // Convert the sorted array back to an object
    const topUsers = sortedUsers.reduce((acc, [uniqueId, user]) => {
        acc[uniqueId] = user;
        return acc;
    }, {});

    return topUsers;
}

// ...

// Add CSS animation for pulsating
const styles = `
    @keyframes pulsate {
        0% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
        }
    }
`;

// Append the styles to the head of the document
$('head').append(`<style>${styles}</style>`);



function addGiftItem(data) {
    const container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');

    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    const streakId = `${data.userId}_${data.giftId}`;

    const html = `
        <div data-streakid="${streakId}" class="gift-item">
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> <span>${data.describe}</span><br>
                <div>
                    <table>
                        <tr>
                            <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                            <td>
                                <span>Name: <b>${data.giftName}</b> (ID:${data.giftId})<span><br>
                                <span>Repeat: <b class="repeat-count" style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()}</b><span><br>
                                <span>Cost: <b>${(data.diamondCount * data.repeatCount).toLocaleString()} Diamonds</b><span>
                            </td>
                        </tr>
                    </table>
                </div>
            </span>
            <div class="thankyou-message">${generateUsernameLink(data)}  شكرا</div>
        </div>
    `;

    container.append(html);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);

    // Play sound
    playGiftSound();

    // Show thank you message in the middle of the screen
    showThankYouMessage(data);

    // Call the function to play the gift sound
    handleGiftReceived();

    // Check if a thank-you message is not currently being displayed, show the next one
    if (!isShowingThankYou) {
        displayNextThankYouMessage();
    }
}

// Queue to manage thank-you messages
const thankYouQueue = [];
let isShowingThankYou = false; // Flag to track whether a thank-you message is currently being displayed

function showThankYouMessage(data) {
    // Check if the message is related to a gift
    if (data && data.giftId) {
        // Check if a thank-you message is already in the queue for this gift
        if (!thankYouQueue.some(item => item.giftId === data.giftId)) {
            // Add the thank-you message to the queue
            thankYouQueue.push(data);

            // If a thank-you message is not currently being displayed, show the next one
            if (!isShowingThankYou) {
                displayNextThankYouMessage();
            }
        }
    }

    // Play the 'c.mp3' audio file
    playAudio('c.mp3');
}

// Function to play audio
function playAudio(audioFile) {
    var audio = new Audio(audioFile);
    audio.play();
}


function displayNextThankYouMessage() {
    // If the queue is not empty, show the next thank-you message
    if (thankYouQueue.length > 0) {
        isShowingThankYou = true;

        const data = thankYouQueue.shift(); // Get the next message from the queue

        const thankYouMessage = $(`
        <div class="thankyou-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #2fb816; font-size: 4em; z-index: 9999; text-align: center;">
            <img class="miniprofilepicture" src="${data.profilePictureUrl}" alt="Profile Picture" style="width: 200px; height: 200px;"> <!-- Adjust width and height as needed -->
            <div>تمد من زود </div>
        </div>
    `);

        // Append the thank-you message to the body
        $('body').append(thankYouMessage);

        // Hide the message after 10 seconds
        setTimeout(() => {
            thankYouMessage.fadeOut(500, () => {
                thankYouMessage.remove(); // Remove the message from the DOM after fading out
                isShowingThankYou = false; // Set the flag to false after hiding the message
                // Restore the background color of the entire page to its original state
                $('body').css('background-color', ''); 
                // Show chat and gift containers
                $('.chatcontainer, .giftcontainer').show();
                displayNextThankYouMessage(); // Show the next thank-you message in the queue
            });
        }, 5000);
    }
}

connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
});

// Counter for tracking likes per user
const userLikes = {};

// Modify the displayTopUsersBattle function to show only the gif during the battle section
// Modify the displayTopUsersBattle function to show the gif in the middle of the battle container
function displayTopUsersBattle() {
    const topUsers = getTopUsers();

    // Check if there are at least two top users
    if (Object.keys(topUsers).length >= 2) {
        const [firstUser] = Object.keys(topUsers);

        // Display a battle message with the gif in the middle
        const battleMessage = `
            <div class="battle-container">
                <div class="battle-profile">
                    <!-- No user profile picture -->
                </div>
                <div class="versus">
                    <img class="gif-image" src="l.gif" alt="L GIF"> <!-- Adjust 'l.gif' as needed -->
                </div>
                <div class="battle-profile">
                    <!-- No user profile picture -->
                </div>
            </div>
        `;

        // Append the battle message to the chat or display it in a specific area
        const container = $('.chatcontainer');
        container.append(battleMessage);

        // Make sure to scroll to the bottom of the chat container after adding the battle message
        container.scrollTop(container.prop("scrollHeight"));
    }
}




// ...

// Helper function to scroll to the bottom of a container
function scrollToBottom(containerSelector) {
    const container = $(containerSelector);
    container.scrollTop(container.prop("scrollHeight"));
}



connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    if (window.settings.showLikes === "0") return;

    if (typeof msg.likeCount === 'number') {
        const color = '#447dd4';
        const username = generateUsernameLink(msg);

        // Check if the user has liked before
        if (!userLikes[msg.uniqueId]) {
            userLikes[msg.uniqueId] = {
                likes: 1,
                imageSize: 5, // Initial image size
            };
        } else {
            userLikes[msg.uniqueId].likes++;
            userLikes[msg.uniqueId].imageSize += 0.05; // Increase image size with each like
        }

        // Display the user's profile picture with an increasing size based on the number of likes
        const imageSize = userLikes[msg.uniqueId].imageSize;
        const profilePicture = `<img class="miniprofilepicture" style="width: ${imageSize}px; height: ${imageSize}px;" src="${msg.profilePictureUrl}">`;

        // Add the chat item with the modified layout
        const rankingNumber = getRankingNumber(msg.uniqueId);
        const rankingNumberHtml = rankingNumber ? `<div class="profile-ranking">${rankingNumber}</div>` : '';
        const text = `${rankingNumberHtml} ${profilePicture} ${username} liked the stream (${userLikes[msg.uniqueId].likes} likes)`;
        addChatItem(color, msg, text);

        // Check if a battle should be displayed (e.g., after every 10 likes)
        if (userLikes[msg.uniqueId].likes % 10 === 0) {
            displayTopUsersBattle();
        }
    }
});

// ...


function addLikeThanksItem(data) {
    const container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    const html = `
        <div class="thankyou-message">
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>${data.describe}</span>
        </div>
    `;

    container.append(html);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}

let joinMsgDelay = 0;
connection.on('member', (msg) => {
    if (window.settings.showJoins === "0") return;

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        addChatItem('#21b2c2', msg, 'joined', true);
    }, joinMsgDelay);
});




// The getRandomColor function is not needed in this case, as we are setting the color to black directly.

connection.on('gift', (data) => {
    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        updateRoomStats();
    }

    if (window.settings.showGifts === "0") return;

    addGiftItem(data);
});

connection.on('streamEnd', () => {
    $('#stateText').text('Stream ended.');

    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
});
function changeBackgroundColor() {
    const randomColor = getRandomColor();
    // Set the background color to a random color for both .chatcontainer and .giftcontainer
    $('.chatcontainer, .giftcontainer').css('background-color', randomColor);
}

let quizGameActive = false;
let currentQuestionIndex = 0;
const quizQuestions = [
    {
        question: "ما هي عاصمة مصر؟",
        options: ["A) القاهرة", "B) الرياض", "C) بغداد"],
        correctAnswer: "A"
    },
  
    // ... (more questions)
];

connection.on('chat', (msg) => {
    const command = msg.comment.trim().toLowerCase();

    if (command === 'ok') {
        // If the message is السلام عليكم, reply with و عليكم السلام و رحمة الله بركاته and show the user's profile picture
        replyToSalam(msg);
    } else if (quizGameActive) {
        switch (command) {
            case 'a':
            case 'b':
            case 'c':
                processUserAnswer(msg, command);
                break;
        }
    } else {
        if (command === '!start') {
            startQuizGame();
        } else {
            // Handle regular chat messages
            addChatItem('', msg, msg.comment);
        }
    }
});

function replyToSalam(msg) {
    // Stop the screen or add your specific logic
    // For example, add a class to hide the content
    $('body').addClass('stopped-screen');

    // Display the response message and user's profile picture
    const responseMessage = 'و عليكم السلام و رحمة الله بركاته';
    const userPicture = msg.profilePictureUrl;

    const html = `
        <div class="response-container">
            <img class="user-profile-picture" src="${userPicture}" alt="User Profile Picture">
            <div class="response-message">${responseMessage}</div>
        </div>
    `;

    // Append the response HTML to the body
    $('body').append(html);

    // Customize the behavior to unhide the screen after a certain time or user action
    // For example, remove the stopped-screen class and the response-container after 5 seconds
    setTimeout(() => {
        $('body').removeClass('stopped-screen');
        $('.response-container').remove();
    }, 5000);
}

function startQuizGame() {
    quizGameActive = true;
    currentQuestionIndex = 0;
    sendQuizQuestion();
}

function sendQuizQuestion() {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const questionMessage = `<div class="question">${currentQuestion.question}</div><br>${currentQuestion.options.map(option => `<div class="option">${option}</div>`).join('<br>')}`;

    // Append quiz content to the quiz container
    $('.quiz-content').html(questionMessage);

    // Add event listener for user response
    $('.option').on('click', function () {
        const userAnswer = $(this).text().trim().toLowerCase();
        processUserAnswer(userAnswer);
    });
}



function processUserAnswer(userAnswer) {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = userAnswer === currentQuestion.correctAnswer.toLowerCase();

    const message = isCorrect
        ? `${generateUsernameLink({ uniqueId: ' ' })} الجواب صحيح`
        : `${generateUsernameLink({ uniqueId: ' ' })}هو الجواب الصحيح  ${currentQuestion.correctAnswer}`;

    const color = isCorrect ? 'green' : 'red';
    addQuizItem(color, message);

    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        setTimeout(() => {
            sendQuizQuestion();
        }, 3000); // Delay before moving to the next question (adjust as needed)
    } else {
        endQuizGame();
    }
}

function addQuizItem(color, text) {
    const container = $('.quiz-content');

    const html = `
        <div style="color: ${color};">${text}</div>
    `;

    container.append(html);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}


function endQuizGame() {
    quizGameActive = false;
    // Clear quiz content when the quiz ends
    $('.quiz-content').html('');
    addChatItem('', { uniqueId: 'QuizBot' }, 'انتهت اللعبة شكرا على الإشتراك');
}