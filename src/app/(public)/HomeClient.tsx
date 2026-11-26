"use client"

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, Headphones, Star, BadgeCheck, Shield, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import styles from './page.module.css'
import CustomSelect from '@/components/public/CustomSelect'
import TiltImage from "@/components/public/TiltImage"
import SmartImage from "@/components/common/SmartImage"
import { formatPropertyPriceLabel, getTransactionTagLabel } from '@/utils/propertyDisplay'

import { PropertyDTO } from '@/types/dto'
// Import estático: gera blur placeholder automático e URL com hash (cache imutável)
import heroImage from '../../../public/herosection-casa.jpeg'

gsap.registerPlugin(ScrollTrigger)

interface HomeClientProps {
  featuredProperties: PropertyDTO[]
}

export default function HomeClient({ featuredProperties }: HomeClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const propertyGridRef = useRef<HTMLDivElement>(null)
  const globeVideoRef = useRef<HTMLVideoElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [shouldLoadGlobeVideo, setShouldLoadGlobeVideo] = useState(false)

  // Carrega e reproduz o vídeo institucional apenas quando estiver próximo da viewport
  useEffect(() => {
    const videoEl = globeVideoRef.current
    if (!videoEl || typeof IntersectionObserver === 'undefined') {
      setShouldLoadGlobeVideo(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoadGlobeVideo(true)
            if (videoEl.readyState >= 2) {
              void videoEl.play().catch(() => {})
            }
          } else if (!videoEl.paused) {
            videoEl.pause()
          }
        }
      },
      { rootMargin: '250px' }
    )

    observer.observe(videoEl)
    return () => observer.disconnect()
  }, [])

  const scrollPropertyGrid = (direction: 'left' | 'right') => {
    if (propertyGridRef.current) {
      const { current } = propertyGridRef
      const scrollAmount = current.clientWidth * 0.85
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' })
    }
  }

  const faqData = [
    {
      question: "Como funciona o processo de compra de imóveis em Garopaba?",
      answer: "Nosso processo é desenhado para ser 100% sem atritos. Cuidamos de toda a documentação e fazemos uma due diligence rigorosa. Do primeiro contato até a entrega das chaves, nossa equipe acompanha cada passo de perto."
    },
    {
      question: "Quais são as vantagens de comprar ou investir no litoral de Santa Catarina?",
      answer: "Santa Catarina tem excelente qualidade de vida e apresenta forte valorização imobiliária. Garopaba se destaca por unir natureza preservada, infraestrutura, segurança e ótimas oportunidades para moradia ou investimento."
    },
    {
      question: "Todos os imóveis do site estão disponíveis?",
      answer: "Trabalhamos duro para manter nossa base de imóveis sempre atualizada. Muitos de nossos imóveis são captados com exclusividade, garantindo segurança tanto para quem vende quanto para quem compra."
    },
    {
      question: "A imobiliária oferece suporte com a papelada?",
      answer: "Sim! Contamos com suporte jurídico e administrativo completo. Nosso objetivo é garantir total segurança e conformidade na sua compra ou locação, sem dores de cabeça."
    }
  ]

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const [transactionType, setTransactionType] = useState('comprar')
  const [location, setLocation] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const router = useRouter()

  const handleQuickSearch = () => {
    const params = new URLSearchParams()
    if (location.trim()) params.append('loc', location.trim())
    if (propertyType) params.append('type', propertyType)
    if (priceRange) params.append('price', priceRange)

    let basePath = '/imoveis/comprar'
    if (transactionType === 'alugar') basePath = '/imoveis/alugar'
    else if (transactionType === 'lancamentos') basePath = '/lancamentos'

    const query = params.toString()
    router.push(query ? `${basePath}?${query}` : basePath)
  }

  useGSAP(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) return

    gsap.fromTo('.searchContainerRef',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.45, delay: 0.05, ease: 'power3.out' }
    )

    gsap.fromTo('.globalNetworkRef',
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.globalNetworkRef',
          start: 'top 88%',
          once: true,
        }
      }
    )

    gsap.fromTo('.featuredHeaderRef',
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.featuredSectionRef',
          start: 'top 85%',
          once: true,
        }
      }
    )

    gsap.fromTo('.propertyCardRef',
      { opacity: 0, y: 36, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.propertyGridRef',
          start: 'top 88%',
          once: true,
        }
      }
    )

    gsap.fromTo('.experienceSectionRef',
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.experienceSectionRef',
          start: 'top 88%',
          once: true,
        }
      }
    )

    gsap.fromTo('.expTextStagger',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: {
          trigger: '.experienceContentRef',
          start: 'top 82%',
          once: true,
        }
      }
    )

    gsap.fromTo('.featureCardRef',
      { opacity: 0, y: 24, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.45,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '.featuresSectionRef',
          start: 'top 82%',
          once: true,
        }
      }
    )

    gsap.fromTo('.faqHeaderRef',
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.faqSectionRef',
          start: 'top 85%',
          once: true,
        }
      }
    )
  }, { scope: containerRef })

  return (
    <main className={styles.main} ref={containerRef}>
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Background Image */}
        <div className={styles.videoBackground}>
          <div className={styles.videoOverlay} style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%)' }}></div>
          <Image
            src={heroImage}
            alt="Golden Imóveis Garopaba"
            fill
            preload
            fetchPriority="high"
            placeholder="blur"
            quality={75}
            sizes="100vw"
            className={styles.heroVideo}
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* Hero Content (Títulos) */}
        <div className={styles.heroContainer} style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div className={styles.heroContent} style={{ textAlign: 'center', color: '#fff', maxWidth: '800px', padding: '0 2rem' }}>
            <h1 className={styles.title} style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', fontWeight: 800, marginBottom: '1rem', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>Golden Imóveis Garopaba</h1>
            <p className={styles.subtitle} style={{ fontSize: '1.25rem', lineHeight: 1.6, opacity: 0.9, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Transformamos o seu desejo em endereço. Encontre o imóvel perfeito em Garopaba com segurança, transparência e as melhores oportunidades da região.
            </p>
          </div>
        </div>

        {/* Floating Search Bar */}
        <div className={`${styles.floatingSearchContainer} searchContainerRef`}>
          <div className={styles.searchBar}>

            <div className={styles.searchField}>
              <CustomSelect
                label="NEGÓCIO"
                defaultValue={transactionType}
                onChange={setTransactionType}
                options={[
                  { value: 'comprar', label: 'Comprar' },
                  { value: 'alugar', label: 'Alugar' },
                  { value: 'lancamentos', label: 'Lançamentos' }
                ]}
              />
            </div>

            <div className={styles.searchDivider}></div>

            <div className={styles.searchField}>
              <label className={styles.searchLabel} htmlFor="quick-search-location">LOCALIZAÇÃO</label>
              <input
                id="quick-search-location"
                type="text"
                placeholder="Ex: Garopaba, SC"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickSearch() }}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.searchDivider}></div>

            <div className={styles.searchField}>
              <CustomSelect
                label="TIPO"
                defaultValue=""
                onChange={setPropertyType}
                options={[
                  { value: '', label: 'Qualquer' },
                  { value: 'Casa', label: 'Casa' },
                  { value: 'Casa de Condomínio', label: 'Casa de Condomínio' },
                  { value: 'Sobrado', label: 'Sobrado' },
                  { value: 'Apartamento', label: 'Apartamento' },
                  { value: 'Cobertura', label: 'Cobertura' },
                  { value: 'Terreno', label: 'Terreno' },
                  { value: 'Sítio', label: 'Sítio' },
                ]}
              />
            </div>

            <div className={styles.searchDivider}></div>

            <div className={styles.searchField}>
              <CustomSelect
                label="VALOR"
                defaultValue=""
                onChange={setPriceRange}
                options={[
                  { value: '', label: 'Qualquer' },
                  { value: '0-500k', label: 'Até R$ 500 mil' },
                  { value: '0-1m', label: 'Até R$ 1 milhão' },
                  { value: '0-2m', label: 'Até R$ 2 milhões' },
                  { value: '0-5', label: 'Até R$ 5M' },
                  { value: '5-10', label: 'R$ 5M - R$ 10M' },
                  { value: '10-20', label: 'R$ 10M - R$ 20M' },
                  { value: '20+', label: 'Acima de R$ 20M' }
                ]}
              />
            </div>

            <button
              type="button"
              className={styles.searchButton}
              onClick={handleQuickSearch}
              aria-label="Buscar imóveis"
            >
              <Search size={24} color="white" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </section>

      {/* Global Network Section */}
      <section className={`${styles.globalNetworkSection} globalNetworkRef`}>
        <div className={styles.globalNetworkContainer}>
          <div className={styles.globalNetworkContent}>
            <span className={styles.globalSubtitle}>DEDICAÇÃO & CONHECIMENTO LOCAL</span>
            <h2 className={styles.globalTitle}>A facilidade de encontrar o imóvel ideal com quem respira Garopaba...</h2>
            <p className={styles.globalDescription}>
              Nascemos com um propósito claro: conectar você ao seu imóvel ideal. Nosso compromisso e profundo conhecimento local garantem que sua experiência de compra ou aluguel em Garopaba e região seja transparente, segura e eficiente do início ao fim.
            </p>

            <Link href="/sobre" className={styles.globalLink}>
              Conheça Garopaba <ArrowRight size={24} className={styles.globalLinkIcon} />
            </Link>

            <div className={styles.globalStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>100%</span>
                <span className={styles.statLabel}>dedicação ao seu perfil</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>+100</span>
                <span className={styles.statLabel}>imóveis verificados</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>01</span>
                <span className={styles.statLabel}>região focada com excelência</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>24h</span>
                <span className={styles.statLabel}>suporte dedicado</span>
              </div>
            </div>
          </div>

          <div className={styles.globalNetworkVideo}>
            <video
              ref={globeVideoRef}
              src={shouldLoadGlobeVideo ? "/video-secao2.mp4" : undefined}
              poster="/video-secao2-poster.jpg"
              preload="none"
              autoPlay={shouldLoadGlobeVideo}
              loop
              muted
              playsInline
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              className={styles.globeVideo}
            />
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className={`${styles.featuredSection} featuredSectionRef`}>
        <div className={`container ${styles.featuredContainer}`}>
          <div className={`${styles.featuredHeader} featuredHeaderRef`}>
            <div>
              <h2 className={styles.featuredTitle}>Imóveis em Destaque</h2>
            </div>
            <div className={styles.carouselControls}>
              <button type="button" onClick={() => scrollPropertyGrid('left')} className={styles.carouselBtn} aria-label="Anterior">
                <ChevronLeft size={24} />
              </button>
              <button type="button" onClick={() => scrollPropertyGrid('right')} className={styles.carouselBtn} aria-label="Próximo">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className={`${styles.propertyGrid} propertyGridRef`} ref={propertyGridRef}>
            {featuredProperties.map((property) => (
              <Link href={`/imoveis/${property.id}`} key={property.id} className={`${styles.propertyCard} propertyCardRef`}>
                <div className={styles.cardImageWrapper} style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <SmartImage
                    src={property.photos && property.photos.length > 0 ? property.photos[0] : '/placeholder.svg'}
                    alt={property.title}
                    className={styles.cardImage}
                    fill
                    quality={80}
                    sizes="(max-width: 1024px) 85vw, 33vw"
                    style={{ objectFit: 'cover' }}
                  />
                  <div className={styles.cardOverlay}></div>
                </div>
                <div className={styles.cardTop}>
                  <span className={styles.statusBadge}>
                    {property.status === 'SOLD' ? 'Vendido' : property.status === 'RENTED' ? 'Alugado' : getTransactionTagLabel(property.transactionType)}
                  </span>
                </div>
                {property.status === 'AVAILABLE' ? (
                  <div className={styles.cardBottom}>
                    <h3 className={styles.propertyPrice}>
                      {formatPropertyPriceLabel(property)}
                    </h3>
                    <p className={styles.propertyAddress}>{property.location}</p>
                    <div className={styles.propertyFeatures}>
                      <span className={styles.featureItem}>{property.suites || property.bedrooms || 0} QUARTOS</span>
                      <span className={styles.featureItem}>{property.bathrooms || 0} BANHEIROS</span>
                      <span className={styles.featureItem}>{property.areaTotal || 0} M²</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.cardBottom}>
                    <h3 className={styles.propertyPrice} style={{ opacity: 0.7 }}>Indisponível</h3>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3D Experience Section */}
      <section className={`${styles.experienceSection} experienceSectionRef`}>
        <div className={styles.experienceContainer}>
          <div className={styles.experienceCanvasWrapper}>
            <TiltImage src="/images/isolated_3d_house.png" alt="3D Floor Plan" />
          </div>

          {/* Lado Direito: Textos */}
          <div className={`${styles.experienceContent} experienceContentRef`}>
            <span className={`${styles.experienceTagline} expTextStagger`}>
              FOCO NO CLIENTE
            </span>

            <h2 className={`${styles.experienceTitle} expTextStagger`}>
              Opções que se Encaixam na<br /><span>Sua Vida em Garopaba</span>
            </h2>

            <p className={`${styles.experienceDescription} expTextStagger`}>
              Nossa seleção abrange as melhores oportunidades da região. Cada propriedade é avaliada detalhadamente para garantir segurança estrutural, boa localização e o melhor custo-benefício para você e sua família.
            </p>

            <ul className={styles.experienceList}>
              <li className="expTextStagger">
                <span className={styles.checkIcon}>✔</span>
                Imóveis selecionados e prontos para morar ou investir.
              </li>
              <li className="expTextStagger">
                <span className={styles.checkIcon}>✔</span>
                Opções com excelente localização e infraestrutura completa.
              </li>
              <li className="expTextStagger">
                <span className={styles.checkIcon}>✔</span>
                Documentação 100% regularizada para uma transação sem surpresas.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features / Benefits Section */}
      <section className={`${styles.featuresSection} featuresSectionRef`}>
        <div className={styles.featuresContainer}>
          <div className={`${styles.featuresText} featuresTextRef`}>
            <h2>Confiança &<br />Transparência</h2>
            <p>
              A Golden Garopaba simplifica o processo de encontrar o imóvel perfeito em Santa Catarina. Com o suporte de especialistas locais, garantimos transparência, agilidade e total dedicação para as suas necessidades.
            </p>
          </div>

          <div className={`${styles.featuresGrid} featuresGridRef`}>
            <div className={`${styles.featureCard} featureCardRef`}>
              <Headphones size={48} className={styles.featureIcon} />
              <h3>Suporte Dedicado</h3>
              <p>Nossa equipe está sempre pronta para tirar dúvidas e ajudar na sua jornada.</p>
            </div>
            <div className={`${styles.featureCard} featureCardRef`}>
              <Star size={48} className={styles.featureIcon} />
              <h3>Seleção Inteligente</h3>
              <p>As melhores oportunidades, casas e lançamentos de Garopaba e região.</p>
            </div>
            <div className={`${styles.featureCard} featureCardRef`}>
              <BadgeCheck size={48} className={styles.featureIcon} />
              <h3>Imóveis Verificados</h3>
              <p>Avaliamos cuidadosamente cada imóvel para garantir a melhor escolha.</p>
            </div>
            <div className={`${styles.featureCard} featureCardRef`}>
              <Shield size={48} className={styles.featureIcon} />
              <h3>Transações Seguras</h3>
              <p>Todo o processo é acompanhado de perto para garantir uma compra segura.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`${styles.faqSection} faqSectionRef`}>
        <div className={styles.faqContainer}>
          <div className={`${styles.faqHeader} faqHeaderRef`}>
            <span className={styles.faqSubtitle}>FAQ</span>
            <h2>Dúvidas Frequentes? <br /><span>Comece por Aqui</span></h2>
          </div>

          <div className={styles.faqList}>
            {faqData.map((faq, index) => (
              <div
                key={index}
                className={`${styles.faqItem} faqItemRef ${openFaq === index ? styles.faqOpen : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className={styles.faqQuestion}>
                  <h3>{faq.question}</h3>
                  <button type="button" className={styles.faqToggleBtn} aria-label={openFaq === index ? 'Fechar resposta' : 'Abrir resposta'}>
                    {openFaq === index ? <X size={24} /> : <Plus size={24} />}
                  </button>
                </div>
                <div
                  className={styles.faqAnswerWrapper}
                  style={{
                    maxHeight: openFaq === index ? '200px' : '0',
                    opacity: openFaq === index ? 1 : 0
                  }}
                >
                  <p className={styles.faqAnswer}>
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
