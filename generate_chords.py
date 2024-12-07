import sys
import json
import os
from midiutil.MidiFile import MIDIFile

def findNextFileName():
    files = os.listdir("./midis")

    numbers = []

    for file in files:
        if (file.endswith('.mid')):
            parts = file.split('.')

            if (parts[0].isdigit()):
                numbers.append(int(parts[0]))

    nextNumber = max(numbers, default=0) + 1

    return f"{"./midis"}/{nextNumber}.mid"

    

chords = {
    "Cmaj": [60, 64, 67],
    "Cmin": [60, 63, 67],
    "Cmaj7": [60, 64, 67, 71],
    "Dmaj": [62, 66, 69],
    "Dmin": [62, 65, 69],
    "Dmin7": [62, 65, 69, 72],
    "Emaj": [64, 68, 71],
    "Emin": [64, 67, 71],
    "Emin7": [64, 67, 71, 74],
    "Fmaj": [65, 69, 72],
    "Fmin": [65, 68, 72],
    "Fmaj7": [65, 69, 72, 76],
    "Gmaj": [67, 71, 74],
    "Gmin": [67, 70, 74],
    "Gmm7": [67, 71, 74, 77],
    "Amaj": [69, 73, 76],
    "Amin": [69, 72, 76],
    "Amin7": [69, 72, 76, 79],
    "Amm7": [69, 73, 76, 79]
}

# circleOfFifths #
progressions = {
    "Emin": ["Amin", "Fmaj", "Fmaj7", "Gmaj", "Cmaj", "Cmaj7", "Amm7", "Emin", "Emin7"],
    "Emin7": ["Amin", "Fmaj", "Fmaj7", "Gmaj", "Cmaj", "Cmaj7", "Amm7", "Emin", "Emin7"],

    "Amin": ["Dmin", "Dmin7", "Fmaj", "Fmaj7", "Gmaj", "Gmm7", "Cmaj", "Cmaj7", "Emin", "Emin7", "Amin", "Amin7"],
    "Amin7": ["Dmin", "Dmin7", "Fmaj", "Fmaj7", "Gmaj", "Gmm7", "Cmaj", "Cmaj7", "Emin", "Emin7", "Amin", "Amin7"],
    "Amm7": ["Dmin", "Dmin7", "Fmaj", "Fmaj7", "Gmaj", "Gmm7", "Cmaj", "Cmaj7", "Emin", "Emin7"],

    "Dmin": ["Gmaj", "Gmm7", "Fmaj", "Fmaj7", "Amin", "Amin7", "Cmaj", "Cmaj7", "Emin", "Emin7", "Dmin", "Dmin7"],
    "Dmin7": ["Gmaj", "Gmm7", "Fmaj", "Fmaj7", "Amin", "Amin7", "Cmaj", "Cmaj7", "Emin", "Emin7", "Dmin", "Dmin7"],

    "Fmaj": ["Gmaj", "Gmm7", "Dmin", "Dmin7", "Cmaj", "Cmaj7", "Amin", "Amin7", "Emin", "Emin7", "Fmaj", "Fmaj7"],
    "Fmin": ["Gmaj", "Gmm7", "Dmin", "Dmin7", "Cmaj", "Cmaj7", "Amin", "Amin7", "Emin", "Emin7", "Fmaj", "Fmaj7"],

    "Gmaj": ["Cmaj", "Cmaj7", "Amin", "Amin7", "Emin", "Emin7", "Fmaj", "Fmaj7", "Amm7", "Dmin", "Dmin7", "Gmaj", "Gmm7"],
    "Gmm7": ["Cmaj", "Cmaj7", "Amin", "Amin7", "Emin", "Emin7", "Fmaj", "Fmaj7", "Amm7", "Gmaj", "Gmm7"],

    "Cmaj": ["Gmaj", "Gmm7", "Amin", "Amin7", "Fmaj", "Fmaj7", "Dmin", "Dmin7", "Emin", "Emin7", "Cmaj", "Cmaj7"]
}


midiF = MIDIFile(2)
track1 = 0
track2 = 1
midiF.addTrackName(track1, 0, "Melody")
midiF.addTrackName(track2, 0, "Chords")
midiF.addTempo(track1, 0, 100)
midiF.addTempo(track2, 0, 100)


def checkIfInChord(note, chord):    # check if note is in any of the chord notes (ignores octaves)
    return any((note % 12) == (chordNote % 12) for chordNote in chord)


def getPossibleChords(notePair):    # gets chords that have at least one note from the input notes in the chord
    possibleChords = []
    for chordName, chordNotes, in chords.items():
        matchCount = sum(1 for note in notePair if (checkIfInChord(note, chordNotes)))

        if (matchCount > 0):
            possibleChords.append((chordName, matchCount))
    
    possibleChords.sort(key=lambda x: -x[1])    # sort in decending order
    return [chord[0] for chord in possibleChords]



def generateBestProgression(melody):
    
    x = len(melody)
    bestScore = float('inf')
    bestProgression = []

    firstNote = melody[0]

    possibleFirstChords = []

    possibleChords = getPossibleChords([firstNote, melody[1]])  # gets possible/matching chords based on the first two notes

    for chord in possibleChords:
        chordNotes = chords[chord]
        if (firstNote % 12 in [note % 12 for note in chordNotes]):  # makes sure the first note is in the chord
            possibleFirstChords.append(chord)

    if (len(possibleFirstChords) < 1):  # if can't find a possible first chord
        possibleFirstChords = ['Cmaj']
    
    for startChord in possibleFirstChords:  # does a greedy search for a chord progression with all possible start chords
        progression = [startChord]
        score = 0

        for i in range(2, x, 2):    # for every 2 eighth notes in the melody
            melodyNotes = [melody[i], melody[i + 1]]
            possibleNextChords = getPossibleChords(melodyNotes) # get possible chords for those 2 melody notes
            bestNextChord = None
            bestNextChordScore = float('inf')

            for nextChord in possibleNextChords:
                if (nextChord in progressions.get(progression[-1], [])):
                    notesInChord = sum(checkIfInChord(note, chords[nextChord]) for note in melodyNotes)

                    if (notesInChord == 2):
                        chordScore = 0
                    elif notesInChord == 1:
                        chordScore = 5
                    else:
                        chordScore = 15

                    progressionIndex = progressions[progression[-1]].index(nextChord)
                    chordScore += progressionIndex

                    if (chordScore < bestNextChordScore):   # get chord with the best (lowest) score
                        bestNextChord = nextChord
                        bestNextChordScore = chordScore

            if (bestNextChord is None): # default to Cmaj if no matching chord is found
                bestNextChord = 'Cmaj'
                bestNextChordScore = 50
                #valid = False

            progression.append(bestNextChord)   # adds best next chord to the list
            score += bestNextChordScore
            
        if (score < bestScore): # update best progression if better one is found
            bestScore = score
            bestProgression = progression

    if not(bestProgression):
        return ['Cmaj'], float('inf')
                    

    return bestProgression



def fixChord(chord, melodyNotes):   # rearranges chord for midi file
    bassNote = min(chord)
    bassNote -= 36          # moves bass note down 3 octaves

    fixedChord = []
    secondBassNote = False  # a bass note can replace a melody note only once

    for chordNote in chord:
        if (chordNote != bassNote):
            for melodyNote in melodyNotes:
                if((chordNote % 12) == (melodyNote % 12)):
                    matchingNote = True
                    break
                else:
                    matchingNote = False

            if (matchingNote and not secondBassNote):       # if a chord note and a melody note have matching pitches, and the bass note hasn't been added a second time
                fixedChord.append(bassNote)
                secondBassNote = True
            else:                                           # else, move the chord note down an octave
                fixedChord.append(chordNote - 12)
        else:
            fixedChord.append(chordNote)

    if (bassNote not in fixedChord):
        fixedChord.append(bassNote)
    fixedChord.sort()

    for i in range(len(fixedChord)):
        for melodyNote in melodyNotes:
            if (fixedChord[i] > melodyNote):
                fixedChord[i] -= 12
            
    while (len(fixedChord) > 3):    # makes sure chord has 3 exactly notes
        fixedChord.pop()
    while (len(fixedChord) < 3):
        fixedChord.append(bassNote)

    return fixedChord

def createMidi(midiFile, melodyTrack, chordTrack, chords, chordProgression, melody, removeLastMelodyNote, keyOffset):
    time = 0
    
    melodyLength = len(melody)
    if removeLastMelodyNote and melodyLength > 0:
        melodyLength -= 1

    for i in range(0, melodyLength, 2):
        chordName = chordProgression[i // 2]
        chord = chords[chordName]

        melodyNotes = [melody[i], melody[i + 1]]

        fixedChord = fixChord(chord, melodyNotes)

        for index, note in enumerate(fixedChord):
            if (note in melodyNotes):
                fixedChord[index] -= 12

        for note in fixedChord:                                         # adds chords as quarter notes
            midiF.addNote(track2, 0, (note + keyOffset), time, 1, 90)

        midiF.addNote(track1, 0, (melody[i] + keyOffset), time, 0.5, 90)    # adds first melody note in pair as an eighth note
        time += 0.5

        if (i < melodyLength - 1):                                              # adds second melody note in pair as an eighth note unless it reached the end of the list
            midiF.addNote(track1, 0, (melody[i + 1] + keyOffset), time, 0.5, 90)
            time += 0.5




if __name__ == "__main__":

    input_data = sys.stdin.read()   # get data from backend
    notes = json.loads(input_data)  # convert data to JSON

    wasOdd = False

    key = notes.pop(0)

    keyOffset = (key - 60)
    
    for index, note in enumerate(notes):    # transpose to be in C major
        note = note - (keyOffset)
        notes[index] = note
    
    if (len(notes) % 2 != 0):
        notes.append(notes[-1])
        wasOdd = True

    bestProgression = generateBestProgression(notes)

    createMidi(midiF, track1, track2, chords, bestProgression, notes, wasOdd, keyOffset)

    filePath = findNextFileName()

    with open(filePath, "wb") as f:
        midiF.writeFile(f)

    print(filePath)