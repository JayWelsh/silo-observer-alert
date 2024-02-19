<br/>
<p align="center">
<img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/silo-observer-alert.png" width="350" alt="alert.silo.observer logo">
</p>

[alert](https://github.com/JayWelsh/silo-observer-alert) | [backend](https://github.com/JayWelsh/silo-observer-backend) | [frontend](https://github.com/JayWelsh/silo-observer-frontend)
# alert.silo.observer

### About
A self-hosted, community-built (unofficial) alert system for [silo.finance](https://silo.finance) interest rates 

### Preface

Decentralized lending protocols present unique challenges for alerting systems, especially when managing high-stakes positions vulnerable to liquidation. Traditional alert service providers often face the risk of user dissatisfaction due to potential downtime or alert delivery failures. This can discourage providers from offering such services, given the possible backlash in case of issues like downtime or alert failures.

To address this, our project focuses on enabling users to easily set up and run their own alerting service. By self-hosting, users maintain control and responsibility, avoiding reliance on third-party alert services.

We advocate for a robust alerting strategy in the decentralized lending space. A healthy setup should include multiple, independent alerting systems running in parallel. This approach ensures that a single point of failure won't compromise the user's position. Users can, for instance, run their instance of this codebase while also subscribing to third-party alert services.

Please note, this codebase is continually evolving and may contain bugs. It is not intended to be a standalone, mission-critical service. Instead, it should be part of a broader, redundant alerting framework to enhance reliability and safety.

### 15-minute setup

This project has been built specifically to be as easy to self-host as possible. No technical knowledge is required. Assuming a user has an account on all of the service providers outlined in the tutorial, one can get set up under 15 minutes (else a few more minutes will need to be spent on signing up for the required services).

### Costs (~ $5 per month)

Since this project relies on self-hosting, it is necessary to pay some hosting fees. The tutorial below guides a user through a method to get this system running for $5 per month. The $5 a month will be the cheapest option for DigitalOcean's instance of the alert provider. The free tier of Alchemy should be sufficient in most cases.

## Tutorial

### Step 1 (Account Creation):

Please create an account on the following websites (log in if already registered):

- [Discord](https://discord.com/)
- [GitHub](https://github.com/)
- [DigitalOcean](https://www.digitalocean.com/)
- [Alchemy](https://alchemy.com/) (Free Tier)

### Step 2 (Project Forking):

Fork [this repo](https://github.com/JayWelsh/silo-observer-alert) onto your own GitHub account:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-2-1.png" width="100%" alt="fork">
</p>

Select your username from the "Owner" dropdown, you can leave the rest as default and then click "Create Fork":

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-2-2.png" width="100%" alt="fork">
</p>

Congratulations, you will now have this repo forked onto your own account, the new repo URL will look something like this: `https://github.com/<YOUR_GITHUB_USERNAME>/silo-observer-alert`.

### Step 3 (Alchemy Keys):

We need to create an "app" for Ethereum Mainnet & Arbitrum Mainnet. If you have just signed up for Alchemy, there is a good chance that an "app" for Ethereum Mainnet has already been created, in which case we only need to add the Arbitrum app.

If you don't have an Ethereum Mainnet and an Arbitrum Mainnet app, create what's missing:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-3-1.png" width="100%" alt="fork">
</p>

Ethereum Mainnet Config:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-3-2.png" width="100%" alt="fork">
</p>

Arbitrum Mainnet Config:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-3-3.png" width="100%" alt="fork">
</p>

Congratulations, you've created your Alchemy Apps which our alerting service will use to query the Ethereum & Arbitrum blockchains for data.

### Step 4 (Discord Bot Creation):

Navigate to the applications section of [Discord's Developer Portal](https://discord.com/developers/applications).

Click "New Application"

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-4-1.png" width="100%" alt="fork">
</p>

Add a name for your application, we call ours "alert.silo.observer" but you can call yours whatever you would like to:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-4-2.png" width="100%" alt="fork">
</p>

Once created, we'd recommend adding a profile picture to your bot for the sake of making notifications easier to spot. Feel free to use [this picture](https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/silo-observer-alert.png). The rest of the settings can be left in their default state.

You will now open up a line of communication with your bot. Due to how Discord works, the only way to open up your line of communication with your bot is to first add the bot to a Discord server that you own, you will then see the bot in the list of members of the server and can send the bot a DM to grant the bot the ability to DM you (it's enough to just send a message that says "hello").

If you don't already own a Discord server, just quickly create one (click "add a server" / the "+" icon at the bottom of your list of Discord servers).

Once you have your own server, copy the "Application ID" of your bot:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-4-3.png" width="100%" alt="fork">
</p>

Now, using the following link as a template, but replace "APPLICATION_ID" with your bot's "Application ID":

`https://discord.com/api/oauth2/authorize?client_id=APPLICATION_ID&permissions=0&scope=bot%20applications.commands`

Example of the edited link (don't use this link, it's just demonstrating the replacement of "APPLICATION_ID" with an Application ID):

`https://discord.com/api/oauth2/authorize?client_id=1234567890123456789&permissions=0&scope=bot%20applications.commands`

Take your adjusted link using your own Application ID and navigate to the link in your browser (where you are signed into Discord):

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-4-4.png" width="100%" alt="fork">
</p>

Congrats, your bot should not be added to the server!

P.S. "the developer" in the context of the screenshot above refers to you, since you created this app within Discord's developer portal.

Next, open up the communication channel with the bot by finding it in your server:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-4-5.png" width="100%" alt="fork">
</p>

Once you have sent a message to the bot, you won't get a reply yet, but our message will have enabled the bot to DM us once our alert service is running, this is all we need to do for now:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-4-6.png" width="100%" alt="fork">
</p>

### Step 5 (Environment Variables):

We are almost done! Now we are going to gather all of the necessary environment variables that we need for our alerting service to run smoothly. Please copy the following into a text editor of your choice:

```
ALCHEMY_API_KEY_ETHEREUM=""
ALCHEMY_API_KEY_ARBITRUM=""
DISCORD_BOT_TOKEN=""
DISCORD_BOT_CLIENT_ID=""
DISCORD_USER_ID_LIST=""
ACCOUNT_WATCHLIST=""
```

Now we just need to fill in the values, I will explain where each value can be found, going in order from top to bottom:

#### ALCHEMY_API_KEY_ETHEREUM

Navigate to your [applications on Alchemy](https://dashboard.alchemy.com/apps) and copy the API Key for your Ethereum Mainnet app, add this value to the quotes for `ALCHEMY_API_KEY_ETHEREUM` (e.g. `ALCHEMY_API_KEY_ETHEREUM="YOUR ETHEREUM API KEY"`)

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-5-1.png" width="100%" alt="fork">
</p>

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-5-3.png" width="100%" alt="fork">
</p>

#### ALCHEMY_API_KEY_ARBITRUM

Navigate to your [applications on Alchemy](https://dashboard.alchemy.com/apps) and copy the API Key for your Arbitrum Mainnet app, add this value to the quotes for `ALCHEMY_API_KEY_ARBITRUM` (e.g. `ALCHEMY_API_KEY_ARBITRUM="YOUR ARBITRUM API KEY"`)

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-5-2.png" width="100%" alt="fork">
</p>

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-5-3.png" width="100%" alt="fork">
</p>

#### DISCORD_BOT_TOKEN

Navigate to [Discord's Developer Portal](https://discord.com/developers/applications), go to your app that we created in step 4, switch to the "Bot" tab and then click "Reset" to get your bot's token:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-5-4.png" width="100%" alt="fork">
</p>

Once the token resets, it will show the new token near where we clicked "Reset", copy the whole value into the quotes for `DISCORD_BOT_TOKEN` (e.g. `DISCORD_BOT_TOKEN="YOUR DISCORD BOT TOKEN"`):

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-5-5.png" width="100%" alt="fork">
</p>

#### DISCORD_BOT_CLIENT_ID

Navigate to [Discord's Developer Portal](https://discord.com/developers/applications), go to your app that we created in step 4, from the "General Information" tab and then click "Copy" on your bot's Application ID:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-5-6.png" width="100%" alt="fork">
</p>

Copy the whole value into the quotes for `DISCORD_BOT_CLIENT_ID` (e.g. `DISCORD_BOT_CLIENT_ID="YOUR DISCORD BOT CLIENT ID"`).

#### DISCORD_USER_ID_LIST

This represents the Discord User ID of your own Discord Account, this is the user that our alert bot will try to inform of any alerts. You can place multiple values into this field, just separate them using ";". Make sure you have messaged the bot as we did at the end of Step 4 from each Discord account in order to ensure that the bot has permission to DM you.

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-5-7.png" width="100%" alt="fork">
</p>

Copy the whole value into the quotes for `DISCORD_USER_ID_LIST` (e.g. `DISCORD_USER_ID_LIST="YOUR DISCORD USER ID"` or `DISCORD_USER_ID_LIST="YOUR DISCORD USER ID;SOME OTHER DISCORD ID"`).

#### ACCOUNT_WATCHLIST

This represents the Ethereum/Arbitrum accounts that we want the alert bot to keep an eye on the interest rates of, here you will place your wallet addresses so that the alert bot knows which silos it should be alerting you about. You can place multiple values into this field, just separate them using ";".

e.g. `ACCOUNT_WATCHLIST="0x0000000000000000000000000000000000000001"` or `ACCOUNT_WATCHLIST="0x0000000000000000000000000000000000000001;0x0000000000000000000000000000000000000002"`

#### Conclusion of Step 5:

You should now have values for all of your required fields in a text editor:

```
ALCHEMY_API_KEY_ETHEREUM="YOUR ETHEREUM API KEY"
ALCHEMY_API_KEY_ARBITRUM="YOUR ARBITRUM API KEY"
DISCORD_BOT_TOKEN="YOUR DISCORD BOT TOKEN"
DISCORD_BOT_CLIENT_ID="DISCORD_BOT_CLIENT_ID"
DISCORD_USER_ID_LIST="YOUR DISCORD USER ID"
ACCOUNT_WATCHLIST="0x0000000000000000000000000000000000000001;0x0000000000000000000000000000000000000002"
```

It's recommend to save this file somewhere locally.

We are now ready for the final step of the process!

### Step 6 (Deployment):

Now that we have done all of the preparation, the only thing left to do is deploy our alert bot!

While logged into DigitalOcean, navigate to the [apps page](https://cloud.digitalocean.com/apps), and click "Create App".

Once on the "Create App" screen, set the Service Provider to GitHub and then click the "Edit Your GitHub Permissions" option near the bottom:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-1.png" width="100%" alt="fork">
</p>

Next, select your own account to install the DigitalOcean app on your GitHub account:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-2.png" width="100%" alt="fork">
</p>

Pick the "Only select repositories" option and then pick the "silo-observer-alert" repo from the list, you can then click "Install & Authorize":

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-3.png" width="100%" alt="fork">
</p>

You will now be redirected back to DigitalOcean and able to select your repository from the dropdown. Leave the settings in their default state with "Autodeploy" selected. Click "Next":

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-4.png" width="100%" alt="fork">
</p>

By default, a ~ $25 "pro" plan is selected, we can adjust this down to a "basic" $5 instance:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-5.png" width="100%" alt="fork">
</p>

This is up to you to do depending on your budget, but leave "containers" set to 1 even if you decide to go with a more expensive option:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-6.png" width="100%" alt="fork">
</p>

Confirm the resource sizing options:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-7.png" width="100%" alt="fork">
</p>

Now we will set our environment variables:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-8.png" width="100%" alt="fork">
</p>

Switch to the "Bulk Editor" view:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-9.png" width="100%" alt="fork">
</p>

Paste the contents of your environment variables which we gathered in Step 5:

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-10.png" width="100%" alt="fork">
</p>

Remember to save your imported variables, and then click "Next":

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-11.png" width="100%" alt="fork">
</p>

Adjust your region if preferred, then click "Next":

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-12.png" width="100%" alt="fork">
</p>

If everything looks good to you (mostly cost), click "Create Resources":

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-13.png" width="100%" alt="fork">
</p>

That's it! If everything went according to plan and all steps were correctly followed, after around 5-10 minutes you should receive a message from your bot on Discord (if you don't end up receiving a message from your bot, then please get in touch via the support details at the bottom of this document):

<p align="center">
  <img src="https://vagabond-public-storage.s3.eu-west-2.amazonaws.com/step-6-14.png" width="100%" alt="fork">
</p>

## Questions / Support

If you have any questions or need any help, please feel free to join the [silo.observer Discord server](https://discord.gg/aUpKaCEy), or alternatively ping @JayWelsh on the silo.finance Discord server.