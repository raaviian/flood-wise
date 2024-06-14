// Initialize Firebase with your configuration
const firebaseConfig = {
  apiKey: "AIzaSyCPuXNVOmWX3OpkcR7Y9qh0wAETCxgmVM8",
  authDomain: "floodwise-backend.firebaseapp.com",
  databaseURL:
    "https://floodwise-backend-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "floodwise-backend",
  storageBucket: "floodwise-backend.appspot.com",
  messagingSenderId: "232729649842",
  appId: "1:232729649842:web:1b653695b09d142dfa9fab",
  measurementId: "G-N5082RR7PG",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Function to handle admin login
document
  .getElementById("adminLoginForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission

    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;

    // Sign in with email and password
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        // Check if the user has admin custom claim
        return user.getIdTokenResult();
      })
      .then((idTokenResult) => {
        // Check if user has admin role
        if (idTokenResult.claims.admin) {
          // Redirect to admin dashboard or perform admin-specific tasks
          window.location.href = "admin_dashboard.html";
        } else {
          // If user does not have admin role, show error message
          alert("You do not have permission to access the admin panel.");
        }
      })
      .catch((error) => {
        // Handle errors
        const errorCode = error.code;
        const errorMessage = error.message;
        alert(errorMessage);
      });
  });
