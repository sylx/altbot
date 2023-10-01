export const generalConfig: GeneralConfigType = {

	// do not touch that
    __templateVersion: '2.0.0',

	name: 'altbot', // the name of your bot
	description: 'yet another ai-powerd discord bot', // the description of your bot
	defaultLocale: 'ja', // default language of the bot, must be a valid locale
	simpleCommandsPrefix: '!', // default prefix for simple command messages (old way to do commands on discord)
	ownerId: process.env['BOT_OWNER_ID'] || '',
	timezone: 'Asia/Tokyo', // default TimeZone to well format and localize dates (logs, stats, etc)

	// useful links
	links: {
		invite: '',
		supportServer: '',
		gitRemoteRepo: 'https://github.com/sylx/altbot',
	},
	
	automaticUploadImagesToImgur: false, // enable or not the automatic assets upload

	devs: [], // discord IDs of the devs that are working on the bot (you don't have to put the owner's id here)

	eval: {
		name: 'bot', // name to trigger the eval command
		onlyOwner: false // restrict the eval command to the owner only (if not, all the devs can trigger it)
	},

	// define the bot activities (phrases under its name). Types can be: PLAYING, LISTENING, WATCHING, STREAMING
    activities: [
		{
			text: 'ああ播磨灘',
			type: 'PLAYING'
		}
	]

}

// global colors
export const colorsConfig = {
	primary: '#2F3136'
}

export const botNames = ["アルトボット","例のボット","ボリコレボット","アルト"]
