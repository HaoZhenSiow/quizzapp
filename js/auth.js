const navbar = document.querySelector("header nav ul");
var modal_btn, modal, modal_cross;

// the checking of auth stastus is too long, store login status in session to make it faster
function setUI(loginStatus) {
	if(loginStatus == 'true') {
		navbar.innerHTML = `
		<li>
			<a href="index.html">Local</a>
		</li>
		<li>
			<a href="cloud.html">Cloud</a>
		</li>
		<li>
			<a href="#" id='accBtn'>Account</a>
		</li>`
		modal_btn = document.getElementById("accBtn");
		modal = document.getElementById("accModal");
		modal_cross = document.getElementById("closeAcc");
		const logoutModal = createModal(modal_btn, modal, modal_cross);
	} else {
		navbar.innerHTML = `
		<li>
			<a href="index.html">Local</a>
		</li>
		<li>
			<a href="cloud.html">Cloud</a>
		</li>
		<li>
			<a href="#" id='loginBtn'>Login</a>
		</li>`
		modal_btn = document.getElementById("loginBtn");
		modal = document.getElementById("loginModal");
		modal_cross = document.getElementById("closeLogin");
		const loginModal = createModal(modal_btn, modal, modal_cross);
	}
}
setUI(sessionStorage.getItem("login"));

// listen for auth status changes
auth.onAuthStateChanged(user => {
	login_status(user);
});

//this function will run onpageload and when login status changes
function login_status(user) {
	if (user) {
		if(!sessionStorage.getItem("login")){}else{
			sessionStorage.setItem("login", true);
			setUI(sessionStorage.getItem("login"));
		}
		let html = `<p>Login in as ${user.email}</p>`;
		document.querySelector('#accModal div p').innerHTML = html;
	} else {
		if(sessionStorage.getItem("login")){
			sessionStorage.setItem("login", false);
			setUI(sessionStorage.getItem("login"));
		}
	}
}

// sessionStorage.setItem("login", false);

//login
const loginForm = document.querySelector('#login-form');
loginForm.addEventListener('submit', e => {
	e.preventDefault();
	let email = loginForm['login-email'].value;
	let password = loginForm['login-password'].value;
	auth.signInWithEmailAndPassword(email, password).then(() => {
		let modal = document.querySelector('#loginModal');
		modal.style.display = "none";
		loginForm.reset();
		loginForm.querySelector('.error').innerHTML = '';
	}).catch(err => {
		loginForm.querySelector('.error').innerHTML = err.message;
	});
});

//logout
const logout = document.querySelector('#logout');
logout.addEventListener('click', e => {
	e.preventDefault();
	let modal = document.querySelector('#accModal');
	modal.style.display = "none";
	auth.signOut();
});
