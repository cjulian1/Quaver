import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import axios from 'axios'
import './Songs.css'

function Songs() {
    const [files, setFiles] = useState([])
    const [fileNames, setFileNames] = useState('')
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const [userID, setUserID] = useState(null)

    const isValidName = (name) => {
        const validChars = /^[a-zA-Z0-9]+$/
        return validChars.test(name)
    }

    const deleteFile = async (fileID) => {      // delete midi file
        try {
            await axios.delete(`http://localhost:3000/api/files/${fileID}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setFiles((prevFilesState) => prevFilesState.filter((file) => file.id !== fileID))
        } catch (error) {
            console.error(error.message)
        }
    }

    const editMelody = (melody, fileName) => {    // go back to editor and import melody
        navigate('/create', { state: { melody, fileName } })
        console.log('sending' + melody + 'and fileName:' + fileName)
    }

    const renameFile = async (fileID) => {
        if (!isValidName(fileNames[fileID])) {
            alert(`Name can't contain special characters`)
            return
        }
        
        let newName = fileNames[fileID]
        if (!newName || !fileID) {                                      // return if missing file name or ID
            console.log('newName: ' + newName + '  fileID: ' + fileID)
            return
        }

        console.log(' equals ' + (newName + `-new_${userID}.mid`))
        if(files.some(file => file.file_path.split('/').pop().replace('.mid', '') === (newName + `-new_${userID}`))) {  // prevents duplicate names
            newName += '-please-stop-' + Math.floor(Math.random()*90000000)
        } else if (files.some(file => file.file_path.split('/').pop().replace('.mid', '') === newName + `_${userID}`)) {
            newName += '-new'
        }

        newName += `_${userID}.mid`     // adds userID and extension
        
        console.log('renaming to ' + newName)
        try {
            const response = await axios.put(
                `http://localhost:3000/api/files/${fileID}`,
                { newName },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (response.data.success) {
                setFiles((prevFilesState) => 
                    prevFilesState.map((file) =>
                    file.id === fileID
                        ? { ...file, file_path: file.file_path.replace(file.file_path.split('/').pop(), newName) }
                    : file 
                    )
                )
                setFileNames((prev) => {
                    const updated = { ...prev }
                    delete updated[fileID]
                    return updated
                })
            } else {
                console.error('failed renaming')
            }
        } catch (error) {
            console.error(error.message)
        }
    }

    const downloadFile = (filePath) => {
        const link = document.createElement('a')
        link.href = `http://localhost:3000${filePath}`
        link.download = filePath.split('/').pop()
        link.click()
    }

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

        const fetchFiles = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/files', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (response.data.success) {
                    setFiles(response.data.files)
                    
                    const firstFile = response.data.files[0]?.file_path.split('/').pop()
                    if(firstFile) {
                        const userIDFromFile = firstFile.split('_')[1]?.replace('.mid', '')
                        if (userIDFromFile) {
                            setUserID(userIDFromFile)
                        }
                    }
                } else {
                    console.error(response.data.message)
                }
            } catch (error) {
                console.error(error.message)
            }
        }

        if(!token) {
            navigate('/')
        } else {
            validateToken()
            fetchFiles()
        }
        
    }, [token, navigate])

    return (
        <>
            <div className='main-div'>
                <h1>Your songs:</h1>
                {files.length === 0 ? (
                    <p>No songs yet.</p>
                ) : (
                    <div>
                        {files.map((file) => (
                            <div key={file.id} className='song-buttons'>
                                <button className='button3' onClick={() => downloadFile(file.file_path)}>
                                    {`Download ${file.file_path.split('/').pop()}`} 
                                </button>
                                <button className='button3' onClick={() => deleteFile(file.id)}>
                                    Delete
                                </button>
                                <button className='button3' onClick={() => editMelody(file.melody_notes, file.file_path.split('/').pop())}>
                                    Edit
                                </button>
                                <input className='input2' type="text" placeholder={fileNames[file.id] || file.file_path.split('/').pop().replace('.mid', '')} onChange={(e) => setFileNames((prev) => ({
                                    ... prev,
                                    [file.id]: e.target.value
                                }))} ></input>
                                <button className='button3' onClick={() => {
                                    renameFile(file.id)
                                }}>Rename</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}

export default Songs
