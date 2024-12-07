import React from 'react'
import './Key.css'

class WhiteKey extends React.Component {    
    render() {
        const { onClick } = this.props
        
        return (
            <div onClick={onClick} className='white-key'>
                <div className="white-note-name">
                    {this.props.note}
                </div>
            </div>
        )
    }
}

class BlackKey extends React.Component {
    render() {
        const { onClick, invisible } = this.props
        
        return (
            <div onClick={onClick} className={ `black-key ${invisible ? 'invisible' : ''}`}>
                <div className='black-note-name'>
                    {this.props.note}
                </div>
            </div>
        )
    }
}

export { WhiteKey }
export { BlackKey }