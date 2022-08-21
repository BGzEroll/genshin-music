import { APP_NAME } from "$/appConfig"
import { ComposerSettings, ComposerSettingsDataType, ComposerSettingsType, MainPageSettings, MainPageSettingsDataType, MainPageSettingsType, MIDISettings, VsrgComposerSettingsType, VsrgComposerSettings, VsrgComposerSettingsDataType, VsrgPlayerSettingsDataType, VsrgPlayerSettings, VsrgPlayerSettingsType } from "$lib/BaseSettings"



class SettingsService{


    getComposerSettings(){
        const json = localStorage.getItem(APP_NAME + "_Composer_Settings")
        try {
            const storedSettings = JSON.parse(json || 'null') as ComposerSettingsType | null
            if (storedSettings) {
                if (storedSettings.other?.settingVersion !== ComposerSettings.other.settingVersion) {
                    this.updateComposerSettings(ComposerSettings.data)
                    return ComposerSettings.data
                }
                return storedSettings.data
            }
            return ComposerSettings.data
        } catch (e) {
            return ComposerSettings.data
        }
    }
    updateComposerSettings(settings: ComposerSettingsDataType){
        const state = {
            other: ComposerSettings.other,
            data: settings
        }
        localStorage.setItem(APP_NAME + "_Composer_Settings", JSON.stringify(state))
    }
    getVsrgComposerSettings(){
        const json = localStorage.getItem(APP_NAME + "_VsrgComposer_Settings")
		try {
			const storedSettings = JSON.parse(json || 'null') as VsrgComposerSettingsType | null
			if (storedSettings) {
				if (storedSettings.other?.settingVersion !== VsrgComposerSettings.other.settingVersion) {
					this.updateVsrgComposerSettings(VsrgComposerSettings.data)
					return VsrgComposerSettings.data
				}
				return storedSettings.data
			}
			return VsrgComposerSettings.data
		} catch (e) {
			return VsrgComposerSettings.data
		}
    }
    updateVsrgComposerSettings(settings: VsrgComposerSettingsDataType){
        const state = {
            other: VsrgComposerSettings.other,
            data: settings
        }
        localStorage.setItem(APP_NAME + "_VsrgComposer_Settings", JSON.stringify(state))

    }
    getPlayerSettings(){
        const json = localStorage.getItem(APP_NAME + "_Player_Settings")
		try {
			const storedSettings = JSON.parse(json || 'null') as MainPageSettingsType | null
			if (storedSettings) {
				if (storedSettings.other?.settingVersion !== MainPageSettings.other.settingVersion) {
					this.updatePlayerSettings(MainPageSettings.data)
					return MainPageSettings.data
				}
				return storedSettings.data
			}
			return MainPageSettings.data
		} catch (e) {
			return MainPageSettings.data
		}
    }
    updatePlayerSettings(settings: MainPageSettingsDataType){
		const state = {
			other: MainPageSettings.other,
			data: settings
		}
		localStorage.setItem(APP_NAME + "_Player_Settings", JSON.stringify(state))
    }
    getVsrgPlayerSettings(){
        const json = localStorage.getItem(APP_NAME + "_VsrgPlayer_Settings")
		try {
			const storedSettings = JSON.parse(json || 'null') as VsrgPlayerSettingsType | null
			if (storedSettings) {
				if (storedSettings.other?.settingVersion !== VsrgPlayerSettings.other.settingVersion) {
					this.updateVsrgPlayerSettings(VsrgPlayerSettings.data)
					return VsrgPlayerSettings.data
				}
				return storedSettings.data
			}
			return VsrgPlayerSettings.data
		} catch (e) {
			return VsrgPlayerSettings.data
		}

    }
    updateVsrgPlayerSettings(settings: VsrgPlayerSettingsDataType){
        const state = {
			other: VsrgPlayerSettings.other,
			data: settings
		}
		localStorage.setItem(APP_NAME + "_VsrgPlayer_Settings", JSON.stringify(state))
    }


    
    getMIDISettings(){
        try {
            const settings = JSON.parse(localStorage.getItem(`${APP_NAME}_MIDI_Settings`) || 'null') as any
            if (settings !== null && settings.settingVersion === MIDISettings.settingVersion) {
                return settings
            } else {
                return MIDISettings
            }
        } catch (e) {
            console.error(e)
            return MIDISettings
        }
    }
    updateMIDISettings(settings: typeof MIDISettings){
        localStorage.setItem(`${APP_NAME}_MIDI_Settings`, JSON.stringify(settings))
    }

}


const settingsService = new SettingsService()
export {
    settingsService
}