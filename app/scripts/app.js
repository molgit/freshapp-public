var client;

init();

async function init() {
  client = await app.initialized();
  client.events.on('app.activated', renderText);

  // Add event listener for the button click
  document.getElementById('webhook-button').addEventListener('click', handleButtonClick);

  // Add event listener for opening the popup when clicking on the response container
  document.getElementById('response-container').addEventListener('click', function() {
    const popup = document.getElementById('response-popup');
    const popupText = document.getElementById('popup-text');
    
    // Copy the content to the popup
    popupText.textContent = this.textContent;
    
    // Show the popup
    popup.style.display = 'block';
  });

  // Close the popup when the user clicks the close button
  document.getElementById('close-popup').addEventListener('click', function() {
    document.getElementById('response-popup').style.display = 'none';
  });

  // Close the popup when the user clicks outside of the popup content
  window.addEventListener('click', function(event) {
    const popup = document.getElementById('response-popup');
    if (event.target === popup) {
      popup.style.display = 'none';
    }
  });
}

async function renderText() {
  const textElement = document.getElementById('apptext');

  // Fetch contact data
  const contactData = await client.data.get('contact');
  const {
    contact: { name, email }
  } = contactData;

  // Fetch ticket data
  const ticketData = await client.data.get("ticket");
  const {
    ticket: { description_text: message }
  } = ticketData;

  // Display the name, email, and message
  textElement.innerHTML = `
    Ticket is created by ${name} <br>
    Email: ${email} <br>
    Message: ${message}
  `;
}

async function handleButtonClick() {
  console.log("Button clicked. Fetching ticket and contact details...");

  try {
    // Fetch ticket data
    const ticketData = await client.data.get("ticket");
    console.log("Raw ticket data:", ticketData); // Debugging log

    // Fetch contact data (linked to the ticket)
    const contactData = await client.data.get("contact");
    console.log("Raw contact data:", contactData); // Debugging log

    // Extract email and message
    const email = contactData.contact.email || 'No email provided';
    const message = ticketData.ticket.description_text || 'No description available';

    console.log("Sending Webhook with Email:", email); // Debugging log
    console.log("Sending Webhook with Message:", message); // Debugging log

    // Send the webhook with the retrieved data
    if (email && message) {
      const webhookResponse = await sendWebhook(email, message);
      console.log("Webhook Response:", webhookResponse); // Log the response
      displayResponse(webhookResponse);
    } else {
      displayError('Email or message not found.');
    }
  } catch (error) {
    console.error('Error fetching ticket or contact details:', error);
    displayError('Failed to retrieve data for the webhook.');
  }
}

async function sendWebhook(email, message) {
  try {
    const webhookUrl = 'https://hook.eu1.make.com/pmh123khnrcpildtj5u2ijog4qoccf';
    const url = `${webhookUrl}?email=${encodeURIComponent(email)}&message=${encodeURIComponent(message)}`;

    const response = await fetch(url, {
      method: 'GET'
    });

    const responseText = await response.text();
    console.log("Raw Webhook Response Text:", responseText); // Log the raw response text

    // Clean up the response text to escape problematic characters
    const cleanedResponseText = responseText.replace(/[\n\r]/g, "\\n");
    console.log("Cleaned Webhook Response Text:", cleanedResponseText); // Log the cleaned response text

    // Attempt to parse the cleaned response as JSON
    try {
      const responseData = JSON.parse(cleanedResponseText);
      console.log("Parsed Webhook Response:", responseData); // Log the parsed response
      return responseData;
    } catch (jsonError) {
      console.error('Error parsing cleaned JSON response:', jsonError);
      return { error: 'Failed to parse cleaned JSON response', rawResponse: responseText };
    }
  } catch (error) {
    console.error('Error sending webhook:', error);
    return { error: 'Failed to send webhook' };
  }
}

function displayResponse(response) {
  const responseContainer = document.getElementById('response-container');

  // Check if response is valid and display it
  if (response && response.summary) {
    responseContainer.innerHTML = `<pre>Summary: ${response.summary}</pre>`;
  } else if (response && response.error) {
    responseContainer.innerHTML = `<pre>Error: ${response.error}</pre>`;
  } else {
    responseContainer.innerHTML = `<pre>Unexpected response format: ${JSON.stringify(response, null, 2)}</pre>`;
  }
}

function displayError(message) {
  const responseContainer = document.getElementById('response-container');
  responseContainer.innerHTML = `<pre>${message}</pre>`;
}
