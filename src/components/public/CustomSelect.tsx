'use client'
import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import styles from './CustomSelect.module.css'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  label: string
  options: Option[]
  defaultValue: string
  onChange?: (value: string) => void
}

export default function CustomSelect({ label, options, defaultValue, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState(
    options.find(opt => opt.value === defaultValue) || options[0]
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={styles.container} ref={containerRef}>
      <label className={styles.label}>{label}</label>
      
      <div 
        className={styles.trigger} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.selectedValue}>{selected.label}</span>
        <ChevronDown 
          size={22} 
          className={styles.icon} 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map(option => (
            <div
              key={option.value}
              className={`${styles.option} ${selected.value === option.value ? styles.selectedOption : ''}`}
              onClick={() => {
                setSelected(option)
                setIsOpen(false)
                if (onChange) onChange(option.value)
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
