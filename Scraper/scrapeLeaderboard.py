from firebase import firebase
import sys
import subprocess
import pickle
import time
from bs4 import BeautifulSoup
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import requests
import json  # Missing import for JSON handling
import warnings
warnings.filterwarnings("ignore", category=UserWarning, message=".*resource_tracker.*")


# Initialize Firebase with the config
firebase = firebase.FirebaseApplication('https://fantasygolf-22bac-default-rtdb.firebaseio.com', None)

def save_screenshot(driver, error_message):
    """Saves a screenshot with a unique name based on the current timestamp."""
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')  # More readable timestamp format
    screenshot_filename = f"/Users/justinpriede/Public/personal stuff as of jul 15/bookTeeTimes/screenshots/error_{timestamp}.png"
    driver.save_screenshot(screenshot_filename)
    print(f"Screenshot saved to {screenshot_filename} due to error: {error_message}")

def fetchLeaderboard():
    """Make requests using the cookies from Selenium."""

    # Set up WebDriver options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--window-size=1920,1080")  # Full HD resolution
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--blink-settings=imagesEnabled=false")  # Disable images
    chrome_options.add_argument("--disable-extensions")  # Disable extensions

    # Automatically download and set up Chrome and ChromeDriver using webdriver_manager
    driver_path = ChromeDriverManager().install()  # This will download ChromeDriver and set the path
    driver = webdriver.Chrome(service=Service(driver_path), options=chrome_options)

    try:
        print("Opening the leaderboard page...")
        driver.get("https://www.pgatour.com/leaderboard")
        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Extract the player rows using the <tr> tag with the appropriate class
        player_data = []

        for player_row in soup.find_all('tr', class_='css-1qtrmek'):
            player = {}

            try:
                # Extract Position
                position_td = player_row.find('td', class_='css-11dj2vk')
                player['position'] = position_td.text.strip() if position_td else "N/A"

                # Extract Player's Name
                player_name_span = player_row.find('span', class_='chakra-text css-hmig5c')
                player['name'] = player_name_span.text.strip() if player_name_span else "N/A"

                # Extract Score
                score_td = player_row.find_all('td', class_='css-139kpds')[2] if len(player_row.find_all('td', class_='css-139kpds')) > 2 else None
                player['score'] = score_td.text.strip() if score_td else "N/A"

                # Extract Rounds (Refined to make sure we get the right columns)
                rounds = player_row.find_all('td', class_='css-139kpds')
                player['rounds'] = [round_.text.strip() for round_ in rounds[6:10]] if len(rounds) > 6 else []

                # Add the player data to the list
                player_data.append(player)
            
            except Exception as e:
                print(f"Error processing player row: {e}")
                continue  # Skip to the next player if an error occurs

        # Check if player_data is populated
        if player_data:
            for player in player_data:
                print(f"Position: {player['position']}")
                print(f"Name: {player['name']}")
                print(f"Score: {player['score']}")
                print(f"Rounds: {', '.join(player['rounds'])}")
                print("-" * 50)  # Just a separator for readability
        else:
            print("❌ No player data found.")

        # Replace the entire players list in Firebase Realtime Database
        firebase.put('/players', 'players', player_data)
        
    except Exception as e:
        print("❌ Unexpected error:", e)
        save_screenshot(driver, str(e))  # Capture screenshot upon error

    finally:
        driver.quit()


# Function to print the current time to the console
def print_current_time():
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"Script started at: {current_time}")

def main(): 
    """Main function to handle login, data fetching, and cron job removal."""
    print_current_time()
    fetchLeaderboard()

if __name__ == "__main__":
    main()
