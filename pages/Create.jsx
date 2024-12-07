import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {Piano} from './components/Piano'
import './App.css'
import axios from 'axios'
import './Create.css'

function App() {
    const token = localStorage.getItem('token')
    
    const [message, setMessage] = useState('')
    const [useSharps, setUseSharps] = useState(true)
    const [choosingKey, setChoosingKey] = useState(true)
    
    const toggleLables = () => {    // changes note lables from sharps to flats
        setUseSharps((prev) => !prev)
    }
    
    const [playedNotes, setPlayedNotes] = useState([])
    const [midiFileName, setMidiFileName] = useState('')

    const isValidName = (name) => {
        const validChars = /^[a-zA-Z0-9]+$/
        return validChars.test(name)
    }

    const [midiFileLink, setMidiFileLink] = useState(null)

    const notePress = (notes) => {
        if (choosingKey) {
            setPlayedNotes(notes)
            setChoosingKey(false)
        } else {
            setPlayedNotes(notes)
        }
    }

    const [octave, setOctave] = useState(4)
    const navigate = useNavigate()
    const location = useLocation()

    const midiToNoteName = (midiNote) => {  // converts midi note value to note name with octave
        const sharpNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        const flatNotes = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B']
        const notes = useSharps ? sharpNotes : flatNotes
        const note = notes[midiNote % 12]
        const octave = Math.floor(midiNote / 12) - 1
        return `${note}${octave}`
    }

    const sendNotes = async () => {
        if (!midiFileName.trim()) {
            alert(`Name can't be empty`)
            return
        }

        if (!isValidName(midiFileName)) {
            alert(`Name can't contain special characters`)
            return
        }
        
        try {
            const response = await axios.post('http://localhost:3000/api/notes', {
                notes: playedNotes,
                fileName: midiFileName,
            }, {
                headers: {Authorization: `Bearer ${token}`}
            })
            if (response.data.success) {
                const midiFilePath = response.data.midiFile
                setMidiFileLink(`${midiFilePath}`)
                setMessage('')
            } else {
                setMessage('No notes to send')
            }

        } catch (error) {
            console.error(error.message)
            setMessage('Failed to send notes')
        }
    }

    useEffect(() => {
        console.log('Location state:', location.state);
        if (location.state?.melody) {
            console.log('true')
            setPlayedNotes(location.state.melody)
            setChoosingKey(false)
        }
        if (location.state?.fileName) {
            setMidiFileName(location.state.fileName)
        }
    }, [])
    
    useEffect(() => {

        const validateToken = async () => {
            try {
                const response = await axios.get('http://localhost:3000/create', {
                    headers: { Authorization: `Bearer ${token}` }
                })

                console.log('Valid token:', response.data.message)
            } catch (error) {
                console.error('Token invalid:', error.response?.status)

                navigate('/')
            }
        }

        if(!token) {
            navigate('/')
        } else {
            validateToken()
        }
        
    }, [token, navigate])

    return (
        <>
            <div>
                
            </div>
            
            <div className='upper-half'>
                
                {choosingKey ? (
                    <h1>Choose a key for the song (major)</h1>
                ) : midiFileLink ? (
                    <button
                        onClick={() => {
                            const link = document.createElement('a')
                            link.href = `http://localhost:3000${midiFileLink}`
                            document.body.appendChild(link)
                            link.download = ({midiFileName} + '.mid')
                            link.click()
                            document.body.removeChild(link)
                        }}
                        className='download'>
                        Download MIDI
                    </button>
                ) : (
                    <h1>{playedNotes.slice(1).map((note) => midiToNoteName(note, useSharps)).join(', ')}</h1>
                )}
                
            </div>
            
            <div className='lower-half'>
                <div className='piano-container'>
                    <Piano playedNotes={playedNotes} octave={octave} onNotePress={notePress} useSharps={useSharps}></Piano>
                    <button className='button' onClick={toggleLables}>
                        Change to {useSharps ? 'Flats' : 'Sharps'}
                    </button>
                </div>

                <div className='octave-buttons'>
                <button onClick={() => setOctave((prev) => Math.max(3, Math.min(5, prev - 1)))} className='button2'>-</button>
                    <button onClick={() => setOctave((prev) => Math.max(3, Math.min(5, prev + 1)))} className='button2'>+</button>
                    <span className='octave-text'>{`C${octave} - B${octave}`}</span>
                </div>
                
                <button onClick={sendNotes} className='generate-button'>
                    Generate Chords
                </button>
                <input className='inputs2' type="text" placeholder="song name" value={midiFileName} onChange={(e) => setMidiFileName(e.target.value)}></input>
            </div>

            <p>{message}</p>
        </>
    )
}

export default App
