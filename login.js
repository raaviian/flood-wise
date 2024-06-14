// // Initialize Firebase with your configuration
// const firebaseConfig = {
//   apiKey: "AIzaSyCPuXNVOmWX3OpkcR7Y9qh0wAETCxgmVM8",
//   authDomain: "floodwise-backend.firebaseapp.com",
//   databaseURL:
//     "https://floodwise-backend-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "floodwise-backend",
//   storageBucket: "floodwise-backend.appspot.com",
//   messagingSenderId: "232729649842",
//   appId: "1:232729649842:web:1b653695b09d142dfa9fab",
//   measurementId: "G-N5082RR7PG",
// };

// // Function to sign in the user
// function signInUser(event) {
//   event.preventDefault();

//   const email = document.getElementById("emailInp").value;
//   const password = document.getElementById("passwordInp").value;

//   auth
//     .signInWithEmailAndPassword(email, password) // <-- Error occurs here
//     .then((userCredential) => {
//       // Sign-in successful, redirect to homepage
//       window.location.href = "homepage.html";
//     })
//     .catch((error) => {
//       // Handle sign-in errors
//       var errorCode = error.code;
//       var errorMessage = error.message;

//       // Function to show the modal for wrong password
//       function showWrongPasswordModal() {
//         var wrongPasswordModal = new bootstrap.Modal(
//           document.getElementById("wrongPasswordModal")
//         );
//         wrongPasswordModal.show();
//       }
//     });
// }

// // Function to handle forgot password
// function forgotPassword() {
//   const email = document.getElementById("emailInp").value;

//   auth
//     .sendPasswordResetEmail(email)
//     .then(() => {
//       // Password reset email sent successfully
//       alert("Password reset email sent. Please check your email inbox.");
//     })
//     .catch((error) => {
//       // Handle errors in sending password reset email
//       console.error("Error sending password reset email:", error);
//       if (error.code === "auth/user-not-found") {
//         showErrorMessageModal("No user found with this email address.");
//       } else {
//         showErrorMessageModal("An error occurred. Please try again later.");
//       }
//     });
// }

// // Function to show error message modal
// function showErrorMessageModal(message) {
//   const errorMessageModal = new bootstrap.Modal(
//     document.getElementById("errorMessageModal")
//   );
//   const errorMessageModalBody = document.getElementById(
//     "errorMessageModalBody"
//   );
//   errorMessageModalBody.textContent = message;
//   errorMessageModal.show();
// }

// // Event listeners
// document.getElementById("signInBtn").addEventListener("click", signInUser);
// document
//   .getElementById("forgotPasswordBtn")
//   .addEventListener("click", forgotPassword);
// document.getElementById("MainForm").addEventListener("submit", signInUser);
