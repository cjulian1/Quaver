import React from 'react'
import * as Tone from 'tone'
import { WhiteKey } from './Key.jsx'
import { BlackKey } from './Key.jsx'
import './Piano.css'

class Piano extends React.Component {
    
    constructor(props) {
        super(props)
        this.state = {
            contextStarted: false,
            synthInitialized: false
        }

        this.keyboard = null
    }

    initializeAudio = async () => {
        const { contextStarted, synthInitialized } = this.state

        if (!contextStarted) {
            try {
                await Tone.start()
                console.log('AudioContext started')
                this.setState({ contextStarted: true })
            } catch (error) {
                console.error(error)
                return
            }
        }

        if (!synthInitialized) {
            try {
                this.keyboard = new Tone.MonoSynth({    // create sawtooth synth
                    oscillator: {type: 'sawtooth'},
                    volume: -10,
                    envelope: {
                        attack: 0.001,
                        decay: 0,
                        sustain: 0.2,
                        release: 0.1
                    }
                }).toDestination()
                this.setState({ synthInitialized: true })
            } catch (error) {
                console.error(error)
            }
        }
    }

    startAudioContext = () => {
        if (!this.state.contextStarted) {
            Tone.start().then(() => {
                console.log('starting AudioContext')
                this.setState({ contextStarted: true })
            }).catch((error) => {
                console.error(`Couldn't start AudioContext?`, error)
            })
        }
    }
    
    keyPress = async (note) => {
        const { octave, onNotePress, playedNotes } = this.props
        const { contextStarted, synthInitialized } = this.state
        
        if (!contextStarted || !synthInitialized) {
            await this.initializeAudio()
            return
        }

        let fixedMidiNote = note

        if (octave < 4) {
            fixedMidiNote = (note - 12)
        } else if (octave > 4) {
            fixedMidiNote = (note + 12)
        } else {
            fixedMidiNote = note
        }

        let now = Tone.now()
        
        this.keyboard.triggerAttackRelease(Tone.Frequency(fixedMidiNote, 'midi').toNote(), '16n', now + 0.00001)
        
        if (onNotePress) {
            onNotePress([...playedNotes, fixedMidiNote])
        }
    }

    deleteLastNote = () => {
        const { onNotePress, playedNotes } = this.props
        const newPlayedNotes = [...playedNotes]
        if (newPlayedNotes.length > 1) {
            newPlayedNotes.pop()
        }

        if (onNotePress) {
            onNotePress(newPlayedNotes)
        }
    }
    
    render() {
        
        const { contextStarted, synthInitialized } = this.state
        const { useSharps } = this.props

        const notes = [
            { type: 'white', sharp: 'C', flat: 'C', midiNote: 60},
            { type: 'black', sharp: 'C#', flat: 'D♭', midiNote: 61 },
            { type: 'white', sharp: 'D', flat: 'D', midiNote: 62 },
            { type: 'black', sharp: 'D#', flat: 'E♭', midiNote: 63 },
            { type: 'white', sharp: 'E', flat: 'E', midiNote: 64 },
            { type: 'invisible', sharp: 'E#', flat: 'F♭' }, // non-existant, for spacing
            { type: 'white', sharp: 'F', flat: 'F', midiNote: 65 },
            { type: 'black', sharp: 'F#', flat: 'G♭', midiNote: 66 },
            { type: 'white', sharp: 'G', flat: 'G', midiNote: 67 },
            { type: 'black', sharp: 'G#', flat: 'A♭', midiNote: 68 },
            { type: 'white', sharp: 'A', flat: 'A', midiNote: 69 },
            { type: 'black', sharp: 'A#', flat: 'B♭', midiNote: 70 },
            { type: 'white', sharp: 'B', flat: 'B', midiNote: 71 },
        ]
        
        return (
            <>
                {!contextStarted || !synthInitialized ? (
                    <div className='load-piano'>
                        <button className='load-piano-button' onClick={this.initializeAudio}>Load Piano</button>
                    </div>
                ) : (
                    <>
                        <button className='button-grey' onClick={this.deleteLastNote}>
                            Delete last note
                        </button>
                        
                        <div className="piano">
                        {notes.map((note, index) => (
                            note.type === 'black' ? (
                                <BlackKey onClick={() => this.keyPress(note.midiNote)} key={index} note={useSharps ? note.sharp : note.flat} />
                            ) : note.type === 'invisible' ? (
                                <BlackKey key={index} note={useSharps ? note.sharp : note.flat} invisible />
                            ) : (
                                <WhiteKey onClick={() => this.keyPress(note.midiNote)} key={index} note={useSharps ? note.sharp : note.flat} />
                            )))}
                        </div>
                    </>
                )}
            </>
        )
    }
}

export { Piano }