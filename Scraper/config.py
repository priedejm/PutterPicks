import pyrebase

# Firebase configuration from your Firebase Console
config = {
    "apiKey": "AIzaSyB3_8lQ7-uxWaXSd8K6dcBMsuh_4EJ5ZSE",
    "authDomain": "fantasygolf-22bac.firebaseapp.com",
    "databaseURL": "https://fantasygolf-22bac-default-rtdb.firebaseio.com",
    "projectId": "fantasygolf-22bac",
    "storageBucket": "fantasygolf-22bac.firebasestorage.app",
    "messagingSenderId": "956483357007",
    "appId": "1:956483357007:web:30ef4e0c246f616dd21d3a",
    "measurementId": "G-7FR9BCNXN6"
}

# Initialize Firebase with the config
firebase = pyrebase.initialize_app(config)

# Get a reference to the Firebase Realtime Database
db = firebase.database()

# Example: Reading data from the database
data = db.child("example").get()
print(data.val())  # Prints the value of the "example" node

# Example: Writing data to the database
db.child("example").set({
    "name": "Test",
    "score": 100
})

# Example: Pushing data to the database
db.child("players").push({
    "name": "Hayden Buckley",
    "score": "+3"
})
