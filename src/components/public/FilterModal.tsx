import { useState, useEffect } from 'react'
import { X, SlidersHorizontal, CalendarDays, Tag, Building2, ChevronDown, ChevronUp } from 'lucide-react'
import styles from './FilterModal.module.css'

export interface FilterState {
  transactionType: 'Alugar' | 'Comprar' | 'Lancamentos'
  searchTerm: string
  propertyCode: string
  category: 'Residencial' | 'Comercial' | 'Rural' | ''
  minPrice: number
  maxPrice: number
  minArea: string
  maxArea: string
  bedrooms: number | null
  bathrooms: number | null
  suites: number | null
  parking: number | null
  propertyTypes: string[]
  amenities: string[]
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  currentFilters: FilterState
  onApply: (filters: FilterState) => void
  totalResults: number
  mode?: 'SALE' | 'RENT' | 'LANCAMENTO'
}

const PROPERTY_CATEGORIES = {
  'Residencial': ['Apartamento', 'Casa', 'Cobertura', 'Casa de Condomínio', 'Sobrado', 'Kitnet / Studio / Flat'],
  'Comercial': ['Sala Comercial', 'Loja', 'Galpão', 'Prédio Comercial', 'Terreno Comercial'],
  'Rural': ['Sítio / Chácara', 'Fazenda', 'Haras', 'Terreno Rural']
}

const FEATURES = [
  'Condomínio fechado', 'De frente para o mar', 'Mobiliado', 'Semimobiliado',
  'Novo', 'Usado', 'Aceita permuta', 'Financiável', 'Elevador'
]

const LEISURE = [
  'Piscina', 'Churrasqueira', 'Salão de festas', 'Salão de jogos',
  'Espaço gourmet', 'Varanda gourmet', 'Sala de cinema', 'Deck molhado'
]

const FURNITURE = [
  'Ar condicionado', 'Armário cozinha', 'Armário embutido', 'Móveis planejados'
]

const INFRASTRUCTURE = [
  'Acessibilidade para PNE', 'Acesso asfaltado', 'Adega', 'Antena TV', 'Aquecimento a gás', 'Aquecimento central', 
  'Aquecimento solar', 'Árvores frutíferas', 'Banheira hidromassagem', 'Bar', 'Cachoeira', 'Canil', 'Caseiro', 
  'Celeiro', 'Central telefônica', 'Cercas', 'Coletiva seletiva de lixo', 'Copa', 'Cozinha gourmet', 'Cozinha grande', 
  'Cozinha independente', 'De esquina', 'Deck', 'Depósito', 'Edícula', 'Elevador', 'Energia solar', 'Entrada lateral', 
  'Escada', 'Espera para split', 'Estacionamento', 'Forno de pizza', 'Gás central', 'Gás individual', 'Hall de entrada', 
  'Hidrômetro individual', 'Hobby box', 'Home office', 'Internet', 'Jacuzzi', 'Janela grande', 'Jardim', 'Lareira', 
  'Lareira a gás (espera)', 'Lavanderia', 'Luminárias', 'Muro', 'Pe direito elevado', 'Pet friendly', 'Porão', 'Quintal', 
  'Recepção', 'Redário', 'Reservatório de água', 'Residência inteligente', 'Sacada', 'Sala de almoço', 'Sótão', 'Telefone', 
  'Varanda fechada com vidro', 'Varanda integrada', 'Varanda separada', 'Vista panorâmica'
]

const ENVIRONMENTS = [
  'Açude', 'Área de serviço', 'Banheiro auxiliar', 'Banheiro social', 'Closet', 'Cozinha', 'Cozinha americana', 
  'Dep. empregada', 'Despensa', 'Energia elétrica', 'Escritório', 'Estar social', 'Horta', 'Lago', 'Lavabo', 'Mezanino', 
  'Nascente', 'Pátio', 'Poço artesiano', 'Pomar', 'Riacho', 'Sala de estar', 'Sala de jantar', 'Terraço', 'Varanda'
]

const SECURITY = [
  'Alarme', 'Circuito TV', 'Fechadura digital', 'Interfone', 'Portão eletrônico', 'Vídeo monitoramento'
]

export default function FilterModal({ isOpen, onClose, currentFilters, onApply, totalResults, mode }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters)
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Lock scroll background via position fixed on body
  useEffect(() => {
    if (isOpen) {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters])

  if (!isOpen) return null

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const handleClear = () => {
    setLocalFilters({
      transactionType: currentFilters.transactionType, // Mantém a aba atual
      searchTerm: '',
      propertyCode: '',
      category: '',
      minPrice: 0,
      maxPrice: 20000000,
      minArea: '',
      maxArea: '',
      bedrooms: null,
      bathrooms: null,
      suites: null,
      parking: null,
      propertyTypes: [],
      amenities: []
    })
  }

  const handleCategoryChange = (cat: 'Residencial' | 'Comercial' | 'Rural' | '') => {
    setLocalFilters(prev => ({
      ...prev,
      category: cat,
      propertyTypes: [] // reset property types when changing category
    }))
  }

  const togglePropertyType = (type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type]
    }))
  }

  const toggleAmenity = (amenity: string) => {
    setLocalFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  // Price Slider Logic
  const minSlider = 0
  const maxSlider = 20000000
  const stepSlider = 50000

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), localFilters.maxPrice - stepSlider)
    setLocalFilters(prev => ({ ...prev, minPrice: value }))
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), localFilters.minPrice + stepSlider)
    setLocalFilters(prev => ({ ...prev, maxPrice: value }))
  }

  const formatPrice = (val: number) => {
    if (val >= 20000000) return 'R$ 20.000.000+'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
  }

  const minPercent = ((localFilters.minPrice - minSlider) / (maxSlider - minSlider)) * 100
  const maxPercent = ((localFilters.maxPrice - minSlider) / (maxSlider - minSlider)) * 100

  return (
    <div className={styles.modalOverlay} data-lenis-prevent="true">
      <div className={styles.modalContent} data-lenis-prevent="true">
        
        <div className={styles.modalHeader}>
          <div className={styles.headerTitle}>
            <SlidersHorizontal size={20} />
            <h2>Filtrar a busca do seu imóvel</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div id="modal-body-scroll" className={styles.modalBody} data-lenis-prevent="true">
          
          {/* Main Tabs */}
          <div className={styles.mainTabsContainer}>
            {mode !== 'SALE' && mode !== 'LANCAMENTO' && (
              <button 
                className={`${styles.mainTabBtn} ${localFilters.transactionType === 'Alugar' ? styles.activeMainTab : ''}`}
                onClick={() => setLocalFilters({...localFilters, transactionType: 'Alugar'})}
              >
                <CalendarDays size={18} /> Alugar
              </button>
            )}
            
            {mode !== 'RENT' && mode !== 'LANCAMENTO' && (
              <button 
                className={`${styles.mainTabBtn} ${localFilters.transactionType === 'Comprar' ? styles.activeMainTab : ''}`}
                onClick={() => setLocalFilters({...localFilters, transactionType: 'Comprar'})}
              >
                <Tag size={18} /> Comprar
              </button>
            )}

            {mode !== 'RENT' && (
              <button 
                className={`${styles.mainTabBtn} ${localFilters.transactionType === 'Lancamentos' ? styles.activeMainTab : ''}`}
                onClick={() => setLocalFilters({...localFilters, transactionType: 'Lancamentos'})}
              >
                <Building2 size={18} /> Lançamentos
              </button>
            )}
          </div>

          {/* Localização e Código */}
          <div className={styles.sectionGrid}>
            <div className={styles.section}>
              <h3>Localização</h3>
              <input 
                type="text" 
                placeholder="Digite ruas, bairros, cidades ou condomínios" 
                className={styles.fullInput}
                value={localFilters.searchTerm}
                onChange={(e) => setLocalFilters({...localFilters, searchTerm: e.target.value})}
              />
            </div>
            <div className={styles.section}>
              <h3>Código do Imóvel</h3>
              <input 
                type="text" 
                placeholder="Ex: CA0023" 
                className={styles.fullInput}
                value={localFilters.propertyCode}
                onChange={(e) => setLocalFilters({...localFilters, propertyCode: e.target.value})}
              />
            </div>
          </div>

          {/* Categoria e Tipo */}
          <div className={styles.section}>
            <h3>Tipo</h3>
            
            <div className={styles.categoryTabs}>
              <button 
                className={`${styles.catTab} ${localFilters.category === '' ? styles.activeCat : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                Todas
              </button>
              <button 
                className={`${styles.catTab} ${localFilters.category === 'Residencial' ? styles.activeCat : ''}`}
                onClick={() => handleCategoryChange('Residencial')}
              >
                Residencial
              </button>
              <button 
                className={`${styles.catTab} ${localFilters.category === 'Comercial' ? styles.activeCat : ''}`}
                onClick={() => handleCategoryChange('Comercial')}
              >
                Comercial
              </button>
              <button 
                className={`${styles.catTab} ${localFilters.category === 'Rural' ? styles.activeCat : ''}`}
                onClick={() => handleCategoryChange('Rural')}
              >
                Rural
              </button>
            </div>

            <div className={styles.checkboxGrid}>
              {localFilters.category && PROPERTY_CATEGORIES[localFilters.category].map(type => (
                <label key={type} className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={localFilters.propertyTypes.includes(type)}
                    onChange={() => togglePropertyType(type)}
                  />
                  <span className={styles.checkboxCustom}></span>
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* Valor (Dual Range Slider) */}
          <div className={styles.section}>
            <h3>Valor</h3>
            <div className={styles.rowInputs}>
              <div className={styles.inputGroup}>
                <label>Mínimo</label>
                <div className={styles.readOnlyValue}>{formatPrice(localFilters.minPrice)}</div>
              </div>
              <div className={styles.inputGroup}>
                <label>Máximo</label>
                <div className={styles.readOnlyValue}>{formatPrice(localFilters.maxPrice)}</div>
              </div>
            </div>

            <div className={styles.sliderContainer}>
              <div className={styles.sliderTrack} />
              <div 
                className={styles.sliderRange} 
                style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }} 
              />
              <input 
                type="range" 
                min={minSlider} 
                max={maxSlider} 
                step={stepSlider} 
                value={localFilters.minPrice} 
                onChange={handleMinChange}
                className={`${styles.thumb} ${styles.thumbLeft}`}
              />
              <input 
                type="range" 
                min={minSlider} 
                max={maxSlider} 
                step={stepSlider} 
                value={localFilters.maxPrice} 
                onChange={handleMaxChange}
                className={`${styles.thumb} ${styles.thumbRight}`}
              />
            </div>
          </div>

          {/* Área */}
          <div className={styles.section}>
            <h3>Área</h3>
            <div className={styles.rowInputs}>
              <div className={styles.inputGroup}>
                <label>Mínima</label>
                <input 
                  type="text" 
                  placeholder="m²" 
                  value={localFilters.minArea}
                  onChange={(e) => setLocalFilters({...localFilters, minArea: e.target.value})}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Máxima</label>
                <input 
                  type="text" 
                  placeholder="m²" 
                  value={localFilters.maxArea}
                  onChange={(e) => setLocalFilters({...localFilters, maxArea: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Contadores */}
          <div className={styles.countersGrid}>
            <div className={styles.counterSection}>
              <h4>Quartos</h4>
              <div className={styles.pillsRow}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button 
                    key={`bed-${num}`}
                    className={`${styles.pillBtn} ${localFilters.bedrooms === num ? styles.activePill : ''}`}
                    onClick={() => setLocalFilters({...localFilters, bedrooms: localFilters.bedrooms === num ? null : num})}
                  >
                    {num}{num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.counterSection}>
              <h4>Banheiros</h4>
              <div className={styles.pillsRow}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button 
                    key={`bath-${num}`}
                    className={`${styles.pillBtn} ${localFilters.bathrooms === num ? styles.activePill : ''}`}
                    onClick={() => setLocalFilters({...localFilters, bathrooms: localFilters.bathrooms === num ? null : num})}
                  >
                    {num}{num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.counterSection}>
              <h4>Suítes</h4>
              <div className={styles.pillsRow}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button 
                    key={`suite-${num}`}
                    className={`${styles.pillBtn} ${localFilters.suites === num ? styles.activePill : ''}`}
                    onClick={() => setLocalFilters({...localFilters, suites: localFilters.suites === num ? null : num})}
                  >
                    {num}{num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.counterSection}>
              <h4>Vagas de garagem</h4>
              <div className={styles.pillsRow}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button 
                    key={`park-${num}`}
                    className={`${styles.pillBtn} ${localFilters.parking === num ? styles.activePill : ''}`}
                    onClick={() => setLocalFilters({...localFilters, parking: localFilters.parking === num ? null : num})}
                  >
                    {num}{num === 5 ? '+' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Características */}
          <div className={styles.section}>
            <h3>Características</h3>
            <div className={styles.checkboxGrid}>
              {FEATURES.map(feature => (
                <label key={feature} className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={localFilters.amenities.includes(feature)}
                    onChange={() => toggleAmenity(feature)}
                  />
                  <span className={styles.checkboxCustom}></span>
                  {feature}
                </label>
              ))}
            </div>
          </div>

          {/* Lazer */}
          <div className={styles.section}>
            <h3>Lazer</h3>
            <div className={styles.checkboxGrid}>
              {LEISURE.map(item => (
                <label key={item} className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={localFilters.amenities.includes(item)}
                    onChange={() => toggleAmenity(item)}
                  />
                  <span className={styles.checkboxCustom}></span>
                  {item}
                </label>
              ))}
            </div>
          </div>

          {/* Botão Ver Mais / Seções Extras */}
          {!showMoreOptions ? (
            <button className={styles.toggleMoreBtn} onClick={() => setShowMoreOptions(true)}>
              Ver mais opções <ChevronDown size={18} />
            </button>
          ) : (
            <div className={styles.extraSections}>
              <div className={styles.section}>
                <h3>Mobílias</h3>
                <div className={styles.checkboxGrid}>
                  {FURNITURE.map(item => (
                    <label key={item} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" checked={localFilters.amenities.includes(item)}
                        onChange={() => toggleAmenity(item)}
                      />
                      <span className={styles.checkboxCustom}></span>{item}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3>Infra e Serviços</h3>
                <div className={styles.checkboxGrid}>
                  {INFRASTRUCTURE.map(item => (
                    <label key={item} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" checked={localFilters.amenities.includes(item)}
                        onChange={() => toggleAmenity(item)}
                      />
                      <span className={styles.checkboxCustom}></span>{item}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3>Ambientes</h3>
                <div className={styles.checkboxGrid}>
                  {ENVIRONMENTS.map(item => (
                    <label key={item} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" checked={localFilters.amenities.includes(item)}
                        onChange={() => toggleAmenity(item)}
                      />
                      <span className={styles.checkboxCustom}></span>{item}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h3>Segurança</h3>
                <div className={styles.checkboxGrid}>
                  {SECURITY.map(item => (
                    <label key={item} className={styles.checkboxLabel}>
                      <input 
                        type="checkbox" checked={localFilters.amenities.includes(item)}
                        onChange={() => toggleAmenity(item)}
                      />
                      <span className={styles.checkboxCustom}></span>{item}
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.toggleLessContainer}>
                <button className={styles.toggleMoreBtn} onClick={() => setShowMoreOptions(false)}>
                  Ver menos <ChevronUp size={18} />
                </button>
              </div>
            </div>
          )}

        </div>

        <div className={styles.modalFooter}>
          <button className={styles.clearBtn} onClick={handleClear}>Limpar Filtros</button>
          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button className={styles.applyBtn} onClick={handleApply}>
              Procurar imóveis ({totalResults})
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
