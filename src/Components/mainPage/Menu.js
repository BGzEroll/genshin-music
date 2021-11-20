import React, { Component, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMusic, faTimes, faCog, faTrash, faCrosshairs, faDownload, faInfo, faCompactDisc, faSearch } from '@fortawesome/free-solid-svg-icons'
import { FaDiscord, FaGithub} from 'react-icons/fa';
import { BsCircle } from 'react-icons/bs'
import { RiPlayListFill } from 'react-icons/ri'
import "./menu.css"
import mainPageImg from '../../assets/images/mainpage.png'
import composerImg from '../../assets/images/composer.png'
import songsImg from '../../assets/images/songs.png'
import { FileDownloader, LoggerEvent, prepareSongImport, prepareSongDownload} from "../SongUtils"
import { FilePicker } from "react-file-picker"
import { appName } from "../../appConfig"
import {songStore} from './SongStore'

class Menu extends Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false,
            selectedMenu: "Songs",
            selectedSongType: "recorded",
            searchInput:'',
            searchedSongs:[],
            searchStatus: 'Write a song name then search!',
            isPersistentStorage: false
        }
 
        this.checkPersistentStorage()
    }

    checkPersistentStorage = async () => {
        if (navigator.storage && navigator.storage.persist) {
            let isPersisted = await navigator.storage.persisted()
            if(!isPersisted) isPersisted = await navigator.storage.persist()
            this.setState({isPersistentStorage: isPersisted})
          }
    }
    handleSearchInput = (text) =>{
        this.setState({
            searchInput: text
        })
    }
    clearSearch = () =>{
        this.setState({
            searchInput: '',
            searchedSongs:[],
            searchStatus: 'Write a song name then search!'
        })
        songStore.data = {
            eventType: "stop",
            song:{},
            start: 0
        }
    }
    searchSongs = async () =>{
        const { searchInput, searchStatus } = this.state
        if(searchStatus === "Searching...") return
        if(searchInput.trim().length === 0){
            return this.setState({
                searchStatus: 'Please write a non empty name'
            })
        }
        this.setState({
            searchStatus: 'Searching...'
        })
        let fetchedSongs = await fetch('https://sky-music.herokuapp.com/api/songs?search='+encodeURI(searchInput)).then(data => data.json())
        if(fetchedSongs.error){
            this.setState({
                searchStatus: 'Please write a non empty name'
            })
            return new LoggerEvent("Error", fetchedSongs.error).trigger()
        }
        this.setState({
            searchedSongs: fetchedSongs,
            searchStatus: 'success'
        })
    }
    toggleMenu = (override) => {
        if (typeof override !== "boolean") override = undefined
        let newState = override !== undefined ? override : !this.state.open
        this.setState({
            open: newState,
        })
    }
    selectSideMenu = (selection) => {
        if (selection === this.state.selectedMenu && this.state.open) {
            return this.setState({
                open: false,
            })
        }
        this.clearSearch()
        this.setState({
            selectedMenu: selection,
            open: true
        })
    }
    changeSelectedSongType = (name) => {
        this.setState({
            selectedSongType: name
        })
    }
    importSong = (file) => {
        const reader = new FileReader();
        reader.addEventListener('load',async (event) => {
            try {
                let songsInput = JSON.parse(event.target.result)
                
                if(!Array.isArray(songsInput)) songsInput = [songsInput]
                for(let song of songsInput){
                    song = prepareSongImport(song)
                    await this.props.functions.addSong(song)
                }
            } catch (e) {
                let fileName = file.name
                console.log(fileName)
                console.error(e)
                if(fileName?.includes?.(".mid")){
                    return new LoggerEvent("Error", "Midi files should be imported in the composer").trigger()
                }   
                new LoggerEvent("Error", "Error importing song").trigger()
                
            }
        })
        reader.readAsText(file)
    }
    downloadSong = (song) => {
        if (song._id) delete song._id
        let songName = song.name
        if(appName === "Sky"){
            //adds old format into the sheet
            song = prepareSongDownload(song)
        }
        if(!Array.isArray(song)) song = [song]
        song.forEach(song1 => {
            song1.data.appName = appName
        })
        let json = JSON.stringify(song)
        let fileDownloader = new FileDownloader()
        fileDownloader.download(json,`${songName}.${appName.toLowerCase()}sheet.json`)
        new LoggerEvent("Success", "Song downloaded").trigger()
    }

    downloadAllSongs = () => {
        let toDownload = []
        this.props.data.songs.forEach(song => {
            if (song._id) delete song._id
            if(appName === "Sky"){
                song = prepareSongDownload(song)
            }
            Array.isArray(song) ? toDownload.push(...song) : toDownload.push(song)
        })
        let fileDownloader = new FileDownloader()
        let json = JSON.stringify(toDownload)
        let date = new Date().toISOString().split('T')[0]
        fileDownloader.download(json,`${appName}_Backup_${date}.json`)
        new LoggerEvent("Success", "Song backup downloaded").trigger()
    }

    render() {
        let sideClass = this.state.open ? "side-menu menu-open" : "side-menu"
        const { data, functions } = this.props
        const { handleSettingChange } = functions
        functions.toggleMenu = this.toggleMenu
        functions.downloadSong = this.downloadSong
        let changePage = this.props.functions.changePage
        let songs = data.songs.filter(song => !song.data.isComposedVersion)
        let composedSongs = data.songs.filter(song => song.data.isComposedVersion)
        const { searchStatus , searchedSongs, selectedMenu } = this.state
        let searchedSongFunctions = {
            importSong: functions.addSong,
        }
        return <div className="menu-wrapper">
            <div className="menu menu-visible">
                {this.state.open && <CloseMenu action={this.toggleMenu} />}
                <MenuItem type="Help" action={this.selectSideMenu} className="margin-top-auto">
                    <FontAwesomeIcon icon={faInfo} className="icon" />
                </MenuItem>
                <MenuItem type="Library" action={this.selectSideMenu}>
                    <RiPlayListFill className='icon'/>
                </MenuItem>
                <MenuItem type="Songs" action={this.selectSideMenu} >
                    <FontAwesomeIcon icon={faMusic} className="icon" />
                </MenuItem>
                <MenuItem type="Settings" action={this.selectSideMenu}>
                    <FontAwesomeIcon icon={faCog} className="icon" />
                </MenuItem>

                <MenuItem type="Composer" action={() => changePage("Composer")}>
                    <FontAwesomeIcon icon={faCompactDisc} className="icon" />
                </MenuItem>
            </div>
            <div className={sideClass}>
                <MenuPanel title="No selection" visible={selectedMenu}>
                </MenuPanel>
                <MenuPanel title="Songs" visible={selectedMenu}>
                    <div className="songs-buttons-wrapper">
                        <button className="genshin-button"
                            onClick={() => changePage("Composer")}
                        >
                            Compose song
                        </button>
                        <FilePicker
                            onChange={(file) => this.importSong(file)}
                        >
                            <button className="genshin-button">
                                Import song
                            </button>
                        </FilePicker>

                    </div>
                    <div className="tab-selector-wrapper">
                        <button
                            className={this.state.selectedSongType === "recorded" ? "tab-selector tab-selected" : "tab-selector"}
                            onClick={() => this.changeSelectedSongType("recorded")}
                        >
                            Recorded
                        </button>
                        <button
                            className={this.state.selectedSongType === "composed" ? "tab-selector tab-selected" : "tab-selector"}
                            onClick={() => this.changeSelectedSongType("composed")}
                        >
                            Composed
                        </button>
                    </div>
                    <div className="songs-wrapper">
                        {this.state.selectedSongType === "recorded"
                            ? songs.map(song => {
                                return <SongRow
                                    data={song}
                                    key={song.name}
                                    functions={functions}
                                >
                                </SongRow>
                            })
                            : composedSongs.map(song => {
                                return <SongRow
                                    data={song}
                                    key={song.name}
                                    functions={functions}
                                >
                                </SongRow>
                            })
                        }
                    </div>
                    <div style={{marginTop:"auto", paddingTop:'0.5rem', width:'100%',display:'flex',justifyContent:'flex-end'}}>
                        <button 
                            className='genshin-button'
                            style={{marginLeft:'auto'}}
                            onClick={this.downloadAllSongs}
                        >
                            Download all songs (backup)
                        </button>
                    </div>
                </MenuPanel>

                <MenuPanel title="Settings" visible={selectedMenu}>
                    {Object.entries(data.settings).map(([key, data]) => {
                        return <SettingsRow
                            key={key + data.value}
                            objKey={key}
                            data={data}
                            update={handleSettingChange}
                        >

                        </SettingsRow>
                    })}
                    <div style={{marginTop:'1rem'}}>
                        {this.state.isPersistentStorage ?"Storage is persisted" : "Storage is not persisted"}
                    </div>
                    {!checkIfTWA() && <a className="donate-button" href="https://www.buymeacoffee.com/Specy" target="_blank" rel="noreferrer">
                        Support me
                    </a>}
                </MenuPanel>
                
                <MenuPanel title="Library" visible={selectedMenu}>
                    <div>
                        Here you can find songs to learn, they are provided by the sky-music library.
                    </div>
                    <div className='library-search-row' >
                        <input 
                            className='library-search-input' 
                            placeholder='Song name'
                            onKeyDown={(e) => {
                                if(e.code === "Enter") this.searchSongs()
                            }}
                            onInput={(e) => this.handleSearchInput(e.target.value)}
                            value={this.state.searchInput}
                        />
                        <button className='library-search-btn' onClick={this.clearSearch}>
                            <FontAwesomeIcon icon={faTimes}/>
                        </button>
                        <button className='library-search-btn' onClick={this.searchSongs}>
                            <FontAwesomeIcon icon={faSearch}/>
                        </button>
                    </div>
                    <div className='library-search-songs-wrapper'>
                        {searchStatus === "success" ?
                            searchedSongs.length > 0 
                                ?   searchedSongs.map(song => 
                                        <SearchedSong
                                            key={song.file}
                                            data={song}
                                            functions={searchedSongFunctions}
                                        >
                                            {song.name}
                                        </SearchedSong>)   
                                :   <div className='library-search-result-text'>
                                        No results
                                    </div>
                            :   <div className='library-search-result-text'>
                                    {searchStatus}
                                </div>
                        }
                    </div>
                </MenuPanel>
                <MenuPanel title="Help" visible={selectedMenu}>
                    <div className='help-icon-wrapper'>
                        <a href='https://discord.gg/Arsf65YYHq' >
                            <FaDiscord className='help-icon' />
                        </a>
                        <a href='https://github.com/Specy/genshin-music' >
                            <FaGithub className='help-icon' />
                        </a>
                        
                    </div>
                    <div 
                        className='go-to-changelog genshin-button'
                        onClick={() => changePage('Changelog')}
                    >
                        Go to changelog
                    </div>
                    <div className='help-title'>
                        Main page
                    </div>
                    <div>
                        <img src={mainPageImg} className='help-img' alt='tutorial for the main page' />
                        <ol>
                            <li>Keyboard</li>
                            <li>Record your keyboard</li>
                            <li>Open the composer</li>
                            <li>Open the settings</li>
                            <li>Open the saved songs</li>
                        </ol>
                        <div className="column">
                            <div>
                                <FontAwesomeIcon icon={faCrosshairs} /> = practice the song
                            </div>
                            <div>
                                <FontAwesomeIcon icon={faDownload} /> = download the song
                            </div>

                        </div>
                    </div>
                    <div className='help-title'>
                        Composer
                    </div>
                    <div>
                        <img src={composerImg} className='help-img' alt="tutorial for composer"/>
                        <ol>
                            <li>Go to the next / previous breakpoint</li>
                            <li>Timeline of the breakpoints</li>
                            <li>Open the tools</li>
                            <li>Add 16 columns to the end</li>
                            <li>Remove the current selected column</li>
                            <li>Add column after the current one</li>
                        </ol>
                        The composer has tools for PC users: <br/><br/>
                            <div style={{marginLeft:'1rem'}}>
                                <Key>A / D</Key> = move left / right <br/>
                                <Key>1 / 2 / 3 / 4</Key> = change tempo <br/>
                                <Key>Space bar</Key> = play / pause song <br/>
                                <Key>Arrow left</Key> = go to previous breakpoint<br/>
                                <Key>Arrow right</Key> = go to next breakpoint <br/>
                                <Key>Q</Key> = remove current column<br/>
                                <Key>E</Key> = add column <br/>
                            </div>
                    </div>
                    <div className='help-title'>
                        Songs menu
                    </div>
                    <div>
                        <img src={songsImg} className='help-img' alt='tutorial for songs page' />
                        <ol>
                            <li>Practice song</li>
                            <li>Download song as json</li>
                            <li>Delete song </li>
                            <li>Open the composer</li>
                            <li>Import a song as json</li>
                            <li>Browse song library</li>
                        </ol>
                        <div className="column">
                            <div>
                                <FontAwesomeIcon icon={faCrosshairs} /> = practice the song
                            </div>
                            <div>
                                <FontAwesomeIcon icon={faDownload} /> = download the song
                            </div>

                        </div>
                    </div>
                    {!checkIfTWA() && <a className="donate-button" href="https://www.buymeacoffee.com/Specy" target="_blank" rel="noreferrer">
                        Support me
                    </a>}
                </MenuPanel>
            </div>
        </div>
    }
}

function Key(props){
    return <div className='keyboard-key'>
        {props.children}
    </div>
}

function MenuPanel(props) {
    let className = props.visible === props.title ? "menu-panel menu-panel-visible" : "menu-panel"
    return <div className={className}>
        <div className="menu-title">
            {props.title}
        </div>
        <div className="panel-content-wrapper">
            {props.children}
        </div>
    </div>
}
function CloseMenu(props) {
    return <div onClick={() => props.action(false)} className="close-menu menu-item">
        <FontAwesomeIcon icon={faTimes} className="icon" />
    </div>
}
function SettingsRow(props) {
    const { data, update, objKey } = props
    const [valueHook, setter] = useState(data.value)
    function handleChange(e) {
        let el = e.target
        let value = data.type === "checkbox" ? el.checked : el.value
        if (data.type === "number") {
            value = Number(value)
            e.target.value = "" //have to do this to remove a react bug that adds a 0 at the start
            if (value < data.threshold[0] || value > data.threshold[1]) {
                return
            }
        }

        setter(value)
    }
    function sendChange() {
        if (data.value === valueHook) return
        data.value = valueHook
        let obj = {
            key: objKey,
            data: data
        }
        update(obj)
    }
    function sendChangeSelect(e) {
        let value = e.target.value
        data.value = value
        let obj = {
            key: objKey,
            data: data
        }
        update(obj)
    }
    if (objKey === "settingVesion") return null
    return <div className="settings-row">
        <div>
            {data.name}
        </div>
        {data.type === "select"
            ? <select value={data.value}
                onChange={sendChangeSelect}
            >
                {data.options.map(e => {
                    return <option value={e} key={e}>{e}</option>
                })}
            </select>
            : <input
                type={data.type}
                placeholder={data.placeholder || ""}
                value={valueHook}
                checked={valueHook}
                onChange={handleChange}
                onBlur={sendChange}
            />}
    </div>
}
function SongRow(props) {
    let data = props.data
    let deleteSong = props.functions.removeSong
    let toggleMenu = props.functions.toggleMenu
    let downloadSong = props.functions.downloadSong
 
    return <div className="song-row">
        <div className="song-name" onClick={() => {
            songStore.data = {
                eventType: 'play',
                song: data,
                start: 0
            }
            toggleMenu(false)
        }}>
            {data.name}
        </div>
        <div className="song-buttons-wrapper">
            <button className="song-button" onClick={() => {
                    songStore.data = {
                        eventType: 'practice',
                        song: data,
                        start: 0
                    }
                    toggleMenu(false)
                }}
            >
                <FontAwesomeIcon icon={faCrosshairs} />
            </button>
            
            <button className="song-button" onClick={() => {
                    songStore.data = {
                        eventType: 'approaching',
                        song: data,
                        start: 0
                    }
                    toggleMenu(false)
                }}
            >
                <BsCircle />
            </button>
            <button className="song-button" onClick={() => downloadSong(data)}>
                <FontAwesomeIcon icon={faDownload} />

            </button>
            <button className="song-button" onClick={() => deleteSong(data.name)}>
                <FontAwesomeIcon icon={faTrash} color="#ed4557" />
            </button>
        </div>
    </div>
}
class MenuItem extends Component {
    render() {
        let className = this.props.className ? `menu-item ${this.props.className}` : "menu-item"
        return <div
            className={className}
            onClick={() => this.props.action(this.props.type)}
        >
            {this.props.children}
        </div>
    }
}

function SearchedSong(props){
    const { functions, data} = props
    const { importSong } = functions
    const download = async function(){
        try{
            let song = await fetch('https://sky-music.herokuapp.com/api/songs?get='+encodeURI(data.file)).then(data => data.json())
            song = prepareSongImport(song)
            importSong(song)
        }catch(e){
            console.error(e)
            new LoggerEvent("Error", "Error downloading song").trigger()
        }
    }
    const play = async function(){
        try{
            let song = await fetch('https://sky-music.herokuapp.com/api/songs?get='+encodeURI(data.file)).then(data => data.json())
            song = prepareSongImport(song)
            songStore.data = {
                eventType: 'play',
                song: song,
                start: 0
            }
        }catch(e){
            console.error(e)
            new LoggerEvent("Error", "Error downloading song").trigger()
        }
    }
    return <div className="song-row">
    <div className="song-name" onClick={() => {
        play(data)
    }}>
        {data.name}
    </div>
    <div className="song-buttons-wrapper">
        <button className="song-button" onClick={download}>
            <FontAwesomeIcon icon={faDownload} />
        </button>
    </div>
</div>
}
function checkIfTWA(){
    let isTwa = JSON.parse(sessionStorage.getItem('isTwa'))
    return isTwa
  }

export default Menu