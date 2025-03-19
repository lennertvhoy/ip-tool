// Constants for different practice modes
const MODES = {
    BINARY: 'binary',
    HEXADECIMAL: 'hexadecimal',
    SUBNETTING: 'subnetting',
    VLSM: 'vlsm'
};

const DIFFICULTIES = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

// State management
let currentState = {
    mode: null,
    difficulty: null,
    score: 0,
    questionCount: 0,
    timer: 0,
    timerInterval: null
};

// Question generators
const questionGenerators = {
    [MODES.BINARY]: {
        [DIFFICULTIES.EASY]: () => {
            const num = Math.floor(Math.random() * 256);
            return {
                question: `Convert ${num} to binary`,
                answer: num.toString(2).padStart(8, '0'),
                explanation: `${num} in binary is ${num.toString(2).padStart(8, '0')}`
            };
        },
        [DIFFICULTIES.MEDIUM]: () => {
            const num1 = Math.floor(Math.random() * 256);
            const num2 = Math.floor(Math.random() * 256);
            return {
                question: `Add these binary numbers:\n${num1.toString(2).padStart(8, '0')}\n${num2.toString(2).padStart(8, '0')}`,
                answer: (num1 + num2).toString(2).padStart(9, '0'),
                explanation: `${num1} (${num1.toString(2)}) + ${num2} (${num2.toString(2)}) = ${num1 + num2} (${(num1 + num2).toString(2)})`
            };
        },
        [DIFFICULTIES.HARD]: () => {
            const num = Math.floor(Math.random() * 65536);
            return {
                question: `Convert ${num.toString(2)} to decimal`,
                answer: num.toString(),
                explanation: `${num.toString(2)} in decimal is ${num}`
            };
        }
    },
    [MODES.HEXADECIMAL]: {
        [DIFFICULTIES.EASY]: () => {
            const num = Math.floor(Math.random() * 256);
            return {
                question: `Convert ${num} to hexadecimal`,
                answer: num.toString(16).toUpperCase(),
                explanation: `${num} in hexadecimal is ${num.toString(16).toUpperCase()}`
            };
        },
        [DIFFICULTIES.MEDIUM]: () => {
            const num = Math.floor(Math.random() * 65536);
            return {
                question: `Convert ${num.toString(16).toUpperCase()} from hexadecimal to decimal`,
                answer: num.toString(),
                explanation: `${num.toString(16).toUpperCase()} in decimal is ${num}`
            };
        },
        [DIFFICULTIES.HARD]: () => {
            const num1 = Math.floor(Math.random() * 256);
            const num2 = Math.floor(Math.random() * 256);
            return {
                question: `Add these hexadecimal numbers:\n${num1.toString(16).toUpperCase()}\n${num2.toString(16).toUpperCase()}`,
                answer: (num1 + num2).toString(16).toUpperCase(),
                explanation: `${num1.toString(16).toUpperCase()} (${num1}) + ${num2.toString(16).toUpperCase()} (${num2}) = ${(num1 + num2).toString(16).toUpperCase()} (${num1 + num2})`
            };
        }
    },
    [MODES.SUBNETTING]: {
        [DIFFICULTIES.EASY]: () => {
            const randomClass = Math.floor(Math.random() * 3);
            const classes = ['A', 'B', 'C'];
            const defaultMasks = ['255.0.0.0', '255.255.0.0', '255.255.255.0'];
            return {
                question: `What is the default subnet mask for a Class ${classes[randomClass]} network?`,
                answer: defaultMasks[randomClass],
                explanation: `Class ${classes[randomClass]} networks have a default subnet mask of ${defaultMasks[randomClass]}`
            };
        },
        [DIFFICULTIES.MEDIUM]: () => {
            const cidr = Math.floor(Math.random() * 9) + 24; // CIDR between 24 and 32
            const mask = calculateSubnetMask(cidr);
            return {
                question: `Convert this CIDR notation to a subnet mask: /${cidr}`,
                answer: mask,
                explanation: `/${cidr} is equivalent to ${mask}`
            };
        },
        [DIFFICULTIES.HARD]: () => {
            const network = `192.168.${Math.floor(Math.random() * 256)}.0`;
            const cidr = Math.floor(Math.random() * 9) + 24;
            return {
                question: `How many usable host addresses are available in ${network}/${cidr}?`,
                answer: Math.pow(2, 32-cidr) - 2,
                explanation: `In a /${cidr} network, there are ${Math.pow(2, 32-cidr)} total addresses, minus 2 for network and broadcast addresses`
            };
        }
    },
    [MODES.VLSM]: {
        [DIFFICULTIES.EASY]: () => {
            const hosts = Math.floor(Math.random() * 50) + 10;
            const requiredBits = Math.ceil(Math.log2(hosts + 2));
            return {
                question: `How many network bits do you need for ${hosts} hosts?`,
                answer: requiredBits.toString(),
                explanation: `For ${hosts} hosts, you need ${requiredBits} bits (${Math.pow(2, requiredBits)} addresses, including network and broadcast)`
            };
        },
        [DIFFICULTIES.MEDIUM]: () => {
            const network = '192.168.1.0/24';
            const subnets = [
                {hosts: 60},
                {hosts: 28},
                {hosts: 12},
                {hosts: 6}
            ];
            return {
                question: `Given network ${network}, what is the first subnet mask you would use for a network requiring ${subnets[0].hosts} hosts?`,
                answer: '255.255.255.192',
                explanation: `For ${subnets[0].hosts} hosts, you need 6 bits (64 addresses), resulting in a /26 or 255.255.255.192`
            };
        },
        [DIFFICULTIES.HARD]: () => {
            return {
                question: 'Order these networks from largest to smallest:\n1) /27\n2) /25\n3) /26\n4) /24',
                answer: '4,2,3,1',
                explanation: '/24 (256 hosts) > /25 (128 hosts) > /26 (64 hosts) > /27 (32 hosts)'
            };
        }
    }
};

// Utility functions
function calculateSubnetMask(cidr) {
    const mask = new Array(4).fill(0);
    for (let i = 0; i < 4; i++) {
        if (cidr >= 8) {
            mask[i] = 255;
            cidr -= 8;
        } else if (cidr > 0) {
            mask[i] = 256 - Math.pow(2, 8 - cidr);
            cidr = 0;
        }
    }
    return mask.join('.');
}

function startTimer() {
    if (currentState.timerInterval) {
        clearInterval(currentState.timerInterval);
    }
    currentState.timer = 0;
    updateTimer();
    currentState.timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    currentState.timer++;
    const minutes = Math.floor(currentState.timer / 60);
    const seconds = currentState.timer % 60;
    document.getElementById('timer').textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateScore(correct) {
    if (correct) {
        currentState.score += getDifficultyPoints();
    }
    document.getElementById('score').textContent = `Score: ${currentState.score}`;
}

function getDifficultyPoints() {
    switch (currentState.difficulty) {
        case DIFFICULTIES.EASY:
            return 1;
        case DIFFICULTIES.MEDIUM:
            return 2;
        case DIFFICULTIES.HARD:
            return 3;
        default:
            return 0;
    }
}

// Event handlers
document.addEventListener('DOMContentLoaded', () => {
    // Set up practice card click handlers
    document.querySelectorAll('.practice-card').forEach(card => {
        const topic = card.dataset.topic;
        card.querySelectorAll('.difficulty-buttons button').forEach(button => {
            button.addEventListener('click', () => {
                const difficulty = button.className;
                startPractice(topic, difficulty);
            });
        });
    });

    // Set up answer submission
    const submitButton = document.getElementById('submit-answer');
    const answerInput = document.getElementById('answer-input');

    submitButton.addEventListener('click', () => checkAnswer());
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
});

// Practice session management
function startPractice(topic, difficulty) {
    currentState.mode = topic;
    currentState.difficulty = difficulty;
    currentState.score = 0;
    currentState.questionCount = 0;

    document.getElementById('practice').classList.add('hidden');
    document.getElementById('practice-area').classList.remove('hidden');
    document.getElementById('practice-title').textContent = `${topic.charAt(0).toUpperCase() + topic.slice(1)} Practice (${difficulty})`;

    startTimer();
    generateQuestion();
}

function generateQuestion() {
    currentState.questionCount++;
    const generator = questionGenerators[currentState.mode][currentState.difficulty];
    currentState.currentQuestion = generator();

    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML = `<div class="question">
        <h3>Question ${currentState.questionCount}</h3>
        <pre>${currentState.currentQuestion.question}</pre>
    </div>`;

    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').focus();
}

function checkAnswer() {
    const userAnswer = document.getElementById('answer-input').value.trim().toUpperCase();
    const correct = userAnswer === currentState.currentQuestion.answer.toUpperCase();

    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML += `<div class="result ${correct ? 'correct' : 'incorrect'}">
        ${correct ? '✓ Correct!' : '✗ Incorrect'}
        <div class="explanation">${currentState.currentQuestion.explanation}</div>
    </div>`;

    updateScore(correct);

    // Generate next question after a short delay
    setTimeout(generateQuestion, 2000);
} 