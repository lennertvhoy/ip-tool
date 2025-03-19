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

// Solution step generators
const solutionSteps = {
    [MODES.BINARY]: {
        decimalToBinary: (decimal) => {
            const steps = [];
            let num = decimal;
            let divisions = [];
            
            while (num > 0) {
                divisions.push({
                    number: num,
                    remainder: num % 2
                });
                num = Math.floor(num / 2);
            }

            steps.push({
                title: "1. Start with the decimal number",
                content: `Number to convert: ${decimal}`
            });
            
            steps.push({
                title: "2. Divide by 2 repeatedly and track remainders",
                content: divisions.map(d => `${d.number} ÷ 2 = ${Math.floor(d.number/2)} remainder ${d.remainder}`).join('\n')
            });
            
            const binary = divisions.map(d => d.remainder).reverse().join('').padStart(8, '0');
            steps.push({
                title: "3. Read remainders from bottom to top",
                content: `Reading the remainders from bottom to top gives us: ${binary}`
            });
            
            return steps;
        },
        binaryToDecimal: (binary) => {
            const steps = [];
            steps.push({
                title: "1. Write out the binary number with position values",
                content: `${binary}\nPosition values: ${binary.split('').map((_, i) => Math.pow(2, binary.length - 1 - i)).join(' ')}`
            });
            
            const calculations = binary.split('').map((bit, i) => {
                const posValue = Math.pow(2, binary.length - 1 - i);
                return bit === '1' ? `1 × ${posValue} = ${posValue}` : `0 × ${posValue} = 0`;
            });
            
            steps.push({
                title: "2. Multiply each digit by its position value",
                content: calculations.join('\n')
            });
            
            const sum = binary.split('').reduce((acc, bit, i) => {
                return acc + (bit === '1' ? Math.pow(2, binary.length - 1 - i) : 0);
            }, 0);
            
            steps.push({
                title: "3. Add all the results",
                content: `Sum: ${calculations.filter(calc => !calc.endsWith('= 0')).join(' + ')}\nFinal result: ${sum}`
            });
            
            return steps;
        }
    },
    [MODES.HEXADECIMAL]: {
        decimalToHex: (decimal) => {
            const steps = [];
            let num = decimal;
            let divisions = [];
            
            while (num > 0) {
                const remainder = num % 16;
                divisions.push({
                    number: num,
                    remainder: remainder < 10 ? remainder : String.fromCharCode(55 + remainder)
                });
                num = Math.floor(num / 16);
            }

            steps.push({
                title: "1. Start with the decimal number",
                content: `Number to convert: ${decimal}`
            });
            
            steps.push({
                title: "2. Divide by 16 repeatedly and track remainders",
                content: divisions.map(d => 
                    `${d.number} ÷ 16 = ${Math.floor(d.number/16)} remainder ${d.remainder}`
                ).join('\n')
            });
            
            const hex = divisions.map(d => d.remainder).reverse().join('');
            steps.push({
                title: "3. Convert remainders to hex digits (10=A, 11=B, etc.)",
                content: "Remainders 10-15 are represented as A-F:\n" +
                        "10=A, 11=B, 12=C, 13=D, 14=E, 15=F"
            });
            
            steps.push({
                title: "4. Read remainders from bottom to top",
                content: `Final hexadecimal number: ${hex}`
            });
            
            return steps;
        },
        hexToDecimal: (hex) => {
            const steps = [];
            steps.push({
                title: "1. Write out the hex number with position values",
                content: `${hex}\nPosition values: ${hex.split('').map((_, i) => Math.pow(16, hex.length - 1 - i)).join(' ')}`
            });
            
            const calculations = hex.split('').map((digit, i) => {
                const posValue = Math.pow(16, hex.length - 1 - i);
                const decimalDigit = parseInt(digit, 16);
                return `${digit} × ${posValue} = ${decimalDigit * posValue}`;
            });
            
            steps.push({
                title: "2. Convert each hex digit to decimal and multiply by position value",
                content: "Hex to decimal conversion:\n" +
                        "A=10, B=11, C=12, D=13, E=14, F=15\n\n" +
                        calculations.join('\n')
            });
            
            const sum = parseInt(hex, 16);
            steps.push({
                title: "3. Add all the results",
                content: `Sum: ${calculations.join(' + ')}\nFinal result: ${sum}`
            });
            
            return steps;
        }
    },
    [MODES.SUBNETTING]: {
        subnetCalculation: (network, cidr) => {
            const steps = [];
            
            // Split the network address
            const octets = network.split('.');
            const binaryOctets = octets.map(octet => 
                parseInt(octet).toString(2).padStart(8, '0')
            );
            
            steps.push({
                title: "1. Convert IP address to binary",
                content: `IP: ${network}\nBinary: ${binaryOctets.join('.')}`
            });
            
            // Create subnet mask
            const maskBits = '1'.repeat(cidr) + '0'.repeat(32 - cidr);
            const maskOctets = [];
            for (let i = 0; i < 32; i += 8) {
                maskOctets.push(maskBits.slice(i, i + 8));
            }
            
            steps.push({
                title: "2. Create subnet mask from CIDR",
                content: `/${cidr} means ${cidr} 1's followed by ${32-cidr} 0's:\n` +
                        `Binary mask: ${maskOctets.join('.')}\n` +
                        `Decimal mask: ${maskOctets.map(o => parseInt(o, 2)).join('.')}`
            });
            
            // Calculate network and broadcast addresses
            const networkBinary = binaryOctets.join('').slice(0, cidr) + '0'.repeat(32 - cidr);
            const broadcastBinary = binaryOctets.join('').slice(0, cidr) + '1'.repeat(32 - cidr);
            
            const networkOctets = [];
            const broadcastOctets = [];
            for (let i = 0; i < 32; i += 8) {
                networkOctets.push(parseInt(networkBinary.slice(i, i + 8), 2));
                broadcastOctets.push(parseInt(broadcastBinary.slice(i, i + 8), 2));
            }
            
            steps.push({
                title: "3. Calculate network and broadcast addresses",
                content: `Network address (all host bits 0):\n${networkOctets.join('.')}\n\n` +
                        `Broadcast address (all host bits 1):\n${broadcastOctets.join('.')}`
            });
            
            const hosts = Math.pow(2, 32 - cidr) - 2;
            steps.push({
                title: "4. Calculate usable host range",
                content: `Number of host bits: ${32 - cidr}\n` +
                        `Total addresses: 2^${32 - cidr} = ${Math.pow(2, 32 - cidr)}\n` +
                        `Usable hosts: ${Math.pow(2, 32 - cidr)} - 2 = ${hosts}\n` +
                        `(Subtract 2 for network and broadcast addresses)`
            });
            
            return steps;
        }
    },
    [MODES.VLSM]: {
        vlsmCalculation: (network, requiredHosts) => {
            const steps = [];
            
            steps.push({
                title: "1. Determine required host bits",
                content: `Hosts needed: ${requiredHosts}\n` +
                        `Formula: 2^n - 2 ≥ ${requiredHosts}\n` +
                        `where n is the number of host bits\n\n` +
                        `Try different values of n:\n` +
                        Array.from({length: 8}, (_, i) => i + 1)
                            .map(n => `2^${n} - 2 = ${Math.pow(2, n) - 2} hosts`)
                            .join('\n')
            });
            
            const hostBits = Math.ceil(Math.log2(requiredHosts + 2));
            const subnetBits = 32 - hostBits;
            
            steps.push({
                title: "2. Calculate CIDR notation",
                content: `Required host bits: ${hostBits}\n` +
                        `CIDR notation: /${subnetBits}\n` +
                        `(32 total bits - ${hostBits} host bits = ${subnetBits} network bits)`
            });
            
            // Convert to binary and calculate subnet mask
            const maskBits = '1'.repeat(subnetBits) + '0'.repeat(hostBits);
            const maskOctets = [];
            for (let i = 0; i < 32; i += 8) {
                maskOctets.push(parseInt(maskBits.slice(i, i + 8), 2));
            }
            
            steps.push({
                title: "3. Calculate subnet mask",
                content: `Binary mask: ${maskBits.match(/.{8}/g).join('.')}\n` +
                        `Decimal mask: ${maskOctets.join('.')}`
            });
            
            return steps;
        }
    }
};

// Question generators with step-by-step solutions
const questionGenerators = {
    [MODES.BINARY]: {
        [DIFFICULTIES.EASY]: () => {
            const num = Math.floor(Math.random() * 256);
            return {
                question: `Convert ${num} to binary`,
                answer: num.toString(2).padStart(8, '0'),
                explanation: `${num} in binary is ${num.toString(2).padStart(8, '0')}`,
                steps: solutionSteps[MODES.BINARY].decimalToBinary(num)
            };
        },
        [DIFFICULTIES.MEDIUM]: () => {
            const num1 = Math.floor(Math.random() * 256);
            const num2 = Math.floor(Math.random() * 256);
            const bin1 = num1.toString(2).padStart(8, '0');
            const bin2 = num2.toString(2).padStart(8, '0');
            return {
                question: `Add these binary numbers:\n${bin1}\n${bin2}`,
                answer: (num1 + num2).toString(2).padStart(9, '0'),
                explanation: `${num1} (${bin1}) + ${num2} (${bin2}) = ${num1 + num2} (${(num1 + num2).toString(2)})`,
                steps: [
                    {
                        title: "1. Convert both numbers to decimal",
                        content: `First number: ${bin1} = ${num1}\nSecond number: ${bin2} = ${num2}`
                    },
                    {
                        title: "2. Add the decimal numbers",
                        content: `${num1} + ${num2} = ${num1 + num2}`
                    },
                    {
                        title: "3. Convert the result back to binary",
                        content: `${num1 + num2} in binary is ${(num1 + num2).toString(2).padStart(9, '0')}`
                    }
                ]
            };
        },
        [DIFFICULTIES.HARD]: () => {
            const num = Math.floor(Math.random() * 65536);
            const binary = num.toString(2);
            return {
                question: `Convert ${binary} to decimal`,
                answer: num.toString(),
                explanation: `${binary} in decimal is ${num}`,
                steps: solutionSteps[MODES.BINARY].binaryToDecimal(binary)
            };
        }
    },
    [MODES.HEXADECIMAL]: {
        [DIFFICULTIES.EASY]: () => {
            const num = Math.floor(Math.random() * 256);
            return {
                question: `Convert ${num} to hexadecimal`,
                answer: num.toString(16).toUpperCase(),
                explanation: `${num} in hexadecimal is ${num.toString(16).toUpperCase()}`,
                steps: solutionSteps[MODES.HEXADECIMAL].decimalToHex(num)
            };
        },
        [DIFFICULTIES.MEDIUM]: () => {
            const num = Math.floor(Math.random() * 65536);
            return {
                question: `Convert ${num.toString(16).toUpperCase()} from hexadecimal to decimal`,
                answer: num.toString(),
                explanation: `${num.toString(16).toUpperCase()} in decimal is ${num}`,
                steps: solutionSteps[MODES.HEXADECIMAL].hexToDecimal(num.toString(16).toUpperCase())
            };
        },
        [DIFFICULTIES.HARD]: () => {
            const num1 = Math.floor(Math.random() * 256);
            const num2 = Math.floor(Math.random() * 256);
            return {
                question: `Add these hexadecimal numbers:\n${num1.toString(16).toUpperCase()}\n${num2.toString(16).toUpperCase()}`,
                answer: (num1 + num2).toString(16).toUpperCase(),
                explanation: `${num1.toString(16).toUpperCase()} (${num1}) + ${num2.toString(16).toUpperCase()} (${num2}) = ${(num1 + num2).toString(16).toUpperCase()} (${num1 + num2})`,
                steps: [
                    {
                        title: "1. Convert both numbers to decimal",
                        content: `First number: ${num1.toString(16).toUpperCase()} = ${num1}\nSecond number: ${num2.toString(16).toUpperCase()} = ${num2}`
                    },
                    {
                        title: "2. Add the decimal numbers",
                        content: `${num1} + ${num2} = ${num1 + num2}`
                    },
                    {
                        title: "3. Convert the result back to hexadecimal",
                        content: `${num1 + num2} in hexadecimal is ${(num1 + num2).toString(16).toUpperCase()}`
                    }
                ]
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
                explanation: `Class ${classes[randomClass]} networks have a default subnet mask of ${defaultMasks[randomClass]}`,
                steps: solutionSteps[MODES.SUBNETTING].subnetCalculation(defaultMasks[randomClass], 8)
            };
        },
        [DIFFICULTIES.MEDIUM]: () => {
            const cidr = Math.floor(Math.random() * 9) + 24; // CIDR between 24 and 32
            const mask = calculateSubnetMask(cidr);
            return {
                question: `Convert this CIDR notation to a subnet mask: /${cidr}`,
                answer: mask,
                explanation: `/${cidr} is equivalent to ${mask}`,
                steps: solutionSteps[MODES.SUBNETTING].subnetCalculation(mask, cidr)
            };
        },
        [DIFFICULTIES.HARD]: () => {
            const network = `192.168.${Math.floor(Math.random() * 256)}.0`;
            const cidr = Math.floor(Math.random() * 9) + 24;
            return {
                question: `How many usable host addresses are available in ${network}/${cidr}?`,
                answer: Math.pow(2, 32-cidr) - 2,
                explanation: `In a /${cidr} network, there are ${Math.pow(2, 32-cidr)} total addresses, minus 2 for network and broadcast addresses`,
                steps: solutionSteps[MODES.SUBNETTING].subnetCalculation(network, cidr)
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
                explanation: `For ${hosts} hosts, you need ${requiredBits} bits (${Math.pow(2, requiredBits)} addresses, including network and broadcast)`,
                steps: solutionSteps[MODES.VLSM].vlsmCalculation(hosts, requiredBits)
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
                explanation: `For ${subnets[0].hosts} hosts, you need 6 bits (64 addresses), resulting in a /26 or 255.255.255.192`,
                steps: solutionSteps[MODES.VLSM].vlsmCalculation(subnets[0].hosts, 6)
            };
        },
        [DIFFICULTIES.HARD]: () => {
            return {
                question: 'Order these networks from largest to smallest:\n1) /27\n2) /25\n3) /26\n4) /24',
                answer: '4,2,3,1',
                explanation: '/24 (256 hosts) > /25 (128 hosts) > /26 (64 hosts) > /27 (32 hosts)',
                steps: [
                    {
                        title: "1. Convert each network to decimal",
                        content: "1) /27 = 27 network bits\n2) /25 = 25 network bits\n3) /26 = 26 network bits\n4) /24 = 24 network bits"
                    },
                    {
                        title: "2. Compare the network bits",
                        content: "24 < 25 < 26 < 27"
                    },
                    {
                        title: "3. Order the networks",
                        content: "4) /24\n2) /25\n3) /26\n1) /27"
                    }
                ]
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

function showSolutionSteps() {
    const steps = currentState.currentQuestion.steps;
    if (!steps) return;

    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'solution-steps';
    
    steps.forEach(step => {
        const stepElement = document.createElement('div');
        stepElement.className = 'solution-step';
        stepElement.innerHTML = `
            <h4>${step.title}</h4>
            <pre>${step.content}</pre>
        `;
        stepsContainer.appendChild(stepElement);
    });

    const questionContainer = document.getElementById('question-container');
    // Remove any existing solution steps
    const existingSteps = questionContainer.querySelector('.solution-steps');
    if (existingSteps) {
        existingSteps.remove();
    }
    questionContainer.appendChild(stepsContainer);
}

function generateQuestion() {
    currentState.questionCount++;
    const generator = questionGenerators[currentState.mode][currentState.difficulty];
    currentState.currentQuestion = generator();

    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML = `<div class="question">
        <h3>Question ${currentState.questionCount}</h3>
        <pre>${currentState.currentQuestion.question}</pre>
        <button id="show-solution" class="show-solution-button">Show Solution Steps</button>
    </div>`;

    // Add event listener for the show solution button
    document.getElementById('show-solution').addEventListener('click', showSolutionSteps);

    // Enable answer input and submit button
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    answerInput.value = '';
    answerInput.disabled = false;
    submitButton.disabled = false;
    answerInput.focus();

    // Hide next question button if it exists
    const nextButton = document.getElementById('next-question');
    if (nextButton) {
        nextButton.style.display = 'none';
    }
}

function checkAnswer() {
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-answer');
    const userAnswer = answerInput.value.trim().toUpperCase();
    const correct = userAnswer === currentState.currentQuestion.answer.toUpperCase();

    // Disable input and submit button after answering
    answerInput.disabled = true;
    submitButton.disabled = true;

    const questionContainer = document.getElementById('question-container');
    questionContainer.innerHTML += `<div class="result ${correct ? 'correct' : 'incorrect'}">
        ${correct ? '✓ Correct!' : '✗ Incorrect'}
        <div class="explanation">${currentState.currentQuestion.explanation}</div>
    </div>`;

    updateScore(correct);

    // Show next question button
    let nextButton = document.getElementById('next-question');
    if (!nextButton) {
        nextButton = document.createElement('button');
        nextButton.id = 'next-question';
        nextButton.className = 'next-button';
        nextButton.textContent = 'Next Question →';
        nextButton.onclick = generateQuestion;
        document.getElementById('answer-container').appendChild(nextButton);
    } else {
        nextButton.style.display = 'block';
    }
} 