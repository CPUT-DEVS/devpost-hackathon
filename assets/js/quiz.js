import { createScoreBoard } from '../../pages/auth/fb.js';
import { checkLoginStatus } from './main.js';
import { run } from './openai.mjs';
import { questions, topics } from './utils/questions.js';
// checkLoginStatus({ path: '../auth/' });

let questionsAI = [];

const quizOptBtns = document.querySelectorAll('.quiz-opt-btn');
const quizTimer = document.querySelector('.quiz-timer > #timer');
const quizQuestion = document.querySelector('.quiz-question #question');
const quizTitle = document.querySelector('#quiz-title');
const gamePin = new URLSearchParams(window.location.search).get('gamePin');
const topicID = new URLSearchParams(window.location.search).get('topic');
const quizBody = document.querySelector('.quiz-body');

//topic questions and correct answer
let T, Q, A, CA;
let question = 0;
const colors = ['var(--prim-color)', 'var(--sec-color)', 'var(--tert-color)', 'var(--quart-color)'];

const setQuizDetails = async () => {
	if (!topicID) {
		alert('Please select a topic to continue');
		window.location.href = '../../index.html';
	} else {
		const topic = topics.find((topic) => topic.id === parseInt(topicID));
		if (!topic) {
			alert('Invalid topic selected');
			window.location.href = '../../index.html';
		}
	}

	const topic = topics.find((topic) => topic.id === parseInt(topicID));
	quizTitle.innerHTML = 'Title: ' + topic.name;

	T = topicID;
	Q = `Q${T}`;
	A = `A${T}`;
	CA = `CA${T}`;

	return topic;
};

const setTranslateAnimation = ({ element, translation }) => {
	element.style.transform = `translateX(${translation}px)`;
	element.style.transition = 'transform 0.2s ease-out';
};

const setQuestions = (question) => {
	const translation = window.innerWidth;
	setTranslateAnimation({ element: quizBody, translation: -translation });

	if (question >= questions[Q].length) {
		moveToPostQuiz();
		return;
	}
	questions[A][question] = questions[A][question].sort(() => Math.random() - 0.5);
	quizQuestion.innerHTML = questionsAI[question].question;

	quizOptBtns.forEach((btn, index) => {
		btn.innerHTML = questionsAI[question].answers[index];
	});

	setQuizBtns();
	setCheckScore(question);

	setTimeout(() => {
		setTranslateAnimation({ element: quizBody, translation: 0 });
	}, translation / 2);
};

function setQuizBtns() {
	const chosen = [];
	quizOptBtns.forEach((btn, index) => {
		while (true) {
			const ran = Math.floor(Math.random() * colors.length);
			if (!chosen.includes(ran)) {
				btn.style.backgroundColor = colors[ran];
				btn.style.boxShadow = `4px 4px 4px 0  ${colors[ran - 1]}`;
				chosen.push(ran);
				break;
			}
		}
	});

	quizOptBtns.forEach((btn) => {
		let prevStyle = btn.style.backgroundColor;
		btn.addEventListener('mouseover', () => {
			btn.style.backgroundColor = 'rgb(73, 165, 165)';
		});
		btn.addEventListener('mouseout', () => {
			btn.style.backgroundColor = prevStyle;
		});
	});
}

setQuizDetails().then(async (topic) => {
	questionsAI = await run({ topic: topic.name });

	setQuizBtns();
	setQuestions(0);
	setQuizTImer({ duration: 40 });
});

const setQuizTImer = ({ duration = 30 }) => {
	quizTimer.style.color = 'white';
	let time = duration;

	let intervalId = setInterval(() => {
		if (time <= 0) {
			if (question >= questions.length - 1) {
				return;
			}

			question++;
			setQuestions(question);
			time = duration;

			// enable all buttons
			quizOptBtns.forEach((btn) => {
				btn.disabled = false;
			});
		}

		if (quizTimer.style.width <= '50%') {
			quizTimer.style.backgroundColor = 'red';
		} else {
			quizTimer.style.backgroundColor = 'var(--quart-color)';
		}

		// time--;
		let min = Math.floor(time / 60);
		let sec = time % 60;
		quizTimer.innerHTML = `${min}:${sec}`;

		// change the with of the timer with respect to the time
		quizTimer.style.width = `${(time / duration) * 100}%`;
	}, 200);
};

function moveToPostQuiz(intervalId) {
	clearInterval(intervalId); // stop the interval
	const retry = new URLSearchParams(window.location.search).get('retry') || false;
	window.location.href = `./post-quiz.html?gamePin=${gamePin}&topic=${topicID}&retry=${retry}`;
}

// check answers and set score
const loginObj = JSON.parse(sessionStorage.getItem('login'));
const username = loginObj.username;
const userScore = 0;
let sessionUser = {
	username: username,
	score: userScore,
};
sessionStorage.setItem('sessionUser', JSON.stringify(sessionUser));

let score = 0;
await createScoreBoard({
	gamePin: gamePin,
	username: username,
	score: sessionUser.score,
	topicID: topicID,
});

async function setCheckScore(question) {
	quizOptBtns.forEach((btn) => {
		btn.addEventListener('click', async () => {
			const correctAnswer = questionsAI[question].correctAnswer;
			if (btn.innerHTML === correctAnswer) {
				score++;
				// set button color to green
				btn.style.backgroundColor = 'green';
				// disable button
				btn.disabled = true;
			} else {
				// set button color to red
				btn.style.backgroundColor = 'red';
			}

			// set a object with score and username
			sessionUser.score = score;
			sessionStorage.setItem('sessionUser', JSON.stringify(sessionUser));

			sessionUser = JSON.parse(sessionStorage.getItem('sessionUser'));
			console.log(sessionUser);

			await createScoreBoard({
				gamePin: gamePin,
				username: username,
				score: sessionUser.score,
				topicID: topicID,
			});
		});
	});
}
