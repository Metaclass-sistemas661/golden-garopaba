"use client"

import { useRef, useState } from 'react'
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

import { PropertyDTO } from '@/types/dto'

// Registra o plugin de scroll
gsap.registerPlugin(ScrollTrigger)

interface HomeClientProps {
  featuredProperties: PropertyDTO[]
}

export default function HomeClient({ featuredProperties }: HomeClientProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const propertyGridRef = useRef<HTMLDivElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0); // Primeiro item aberto por padrão

  // Lógica de Dual-Video Crossfade (Enterprise Grade)
  const [activeVideo, setActiveVideo] = useState<1 | 2>(1);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  const handleVideoEnded = (nextVid: 1 | 2, nextRef: React.RefObject<HTMLVideoElement | null>) => {
    setActiveVideo(nextVid);
    if (nextRef.current) {
      nextRef.current.currentTime = 0;
      nextRef.current.play().catch(() => {});
    }
  };

  const scrollPropertyGrid = (direction: 'left' | 'right') => {
    if (propertyGridRef.current) {
      const { current } = propertyGridRef;
      const scrollAmount = current.clientWidth * 0.85;
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const faqData = [
    {
      question: "Como funciona o processo de compra de imóveis de luxo em Garopaba?",
      answer: "Nosso processo é desenhado para ser 100% sem atritos. Cuidamos de toda a documentação, due diligence jurídica e negociação sigilosa. Do primeiro contato até a entrega das chaves, o corretor Rafael Jesse acompanha cada passo pessoalmente."
    },
    {
      question: "Quais são as vantagens de investir no litoral de Santa Catarina?",
      answer: "Santa Catarina apresenta a maior valorização imobiliária do Brasil nos últimos anos. Garopaba, especificamente, une natureza preservada, segurança de primeiro mundo e um plano diretor rigoroso que garante a exclusividade e a valorização contínua do seu investimento."
    },
    {
      question: "As propriedades listadas são exclusivas da Golden Garopaba?",
      answer: "Sim. A grande maioria do nosso portfólio de alto padrão é trabalhada em regime de exclusividade off-market. Isso garante total privacidade aos vendedores e acesso privilegiado aos nossos clientes investidores."
    },
    {
      question: "Vocês oferecem assessoria jurídica e tributária?",
      answer: "Contamos com um corpo jurídico e administrativo blindado, especializado em transações imobiliárias de alto volume, garantindo total segurança, conformidade e eficiência tributária na sua aquisição."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const [transactionType, setTransactionType] = useState('comprar');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const router = useRouter();

  const handleQuickSearch = () => {
    const params = new URLSearchParams();
    if (location) params.append('loc', location);
    if (propertyType) params.append('type', propertyType);
    if (priceRange) params.append('price', priceRange);
    
    let basePath = '/imoveis/comprar';
    if (transactionType === 'alugar') basePath = '/imoveis/alugar';
    else if (transactionType === 'lancamentos') basePath = '/lancamentos';
    
    router.push(`${basePath}?${params.toString()}`);
  };

  useGSAP(() => {
    // 1. Hero Search Bar Fade In (Mantém a entrada principal limpa, mas mais lenta e densa)
    gsap.fromTo('.searchContainerRef', 
      { opacity: 0, y: 80, scale: 0.98 }, 
      { opacity: 1, y: 0, scale: 1, duration: 1.5, delay: 0.8, ease: 'power4.out' }
    );

    // 2. Global Network Section (Revelação Pesada com Scrubbing Parallax)
    gsap.fromTo('.globalNetworkRef',
      { opacity: 0, y: 150, scale: 0.95 },
      {
        opacity: 1, 
        y: 0,
        scale: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.globalNetworkRef',
          start: 'top 90%', 
          end: 'top 50%',
          scrub: 1.5, // Animação amarrada ao scroll com inércia de 1.5s (pesado)
        }
      }
    );

    // 3. Featured Properties Header (Surgindo de forma dramática)
    gsap.fromTo('.featuredHeaderRef',
      { opacity: 0, y: 100, rotateX: 10 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1.5,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.featuredSectionRef',
          start: 'top 80%'
        }
      }
    );

    // 4. Property Cards Stagger (Impacto visual agressivo nos cards de imóveis)
    gsap.fromTo('.propertyCardRef',
      { opacity: 0, y: 200, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.8,
        ease: 'power4.out',
        stagger: 0.3, // Atraso longo para um "surgir" dramático
        scrollTrigger: {
          trigger: '.propertyGridRef',
          start: 'top 85%',
        }
      }
    );

    // 5. 3D Experience Section (O Bloco inteiro ganha forma do fundo)
    gsap.fromTo('.experienceSectionRef',
      { opacity: 0, y: 200, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.experienceSectionRef',
          start: 'top 95%',
          end: 'top 40%',
          scrub: 2, // Extremamente amarrado à rolagem (sensação de peso)
        }
      }
    );

    // 6. Experience Texts Stagger (Os textos desabrocham pesadamente)
    gsap.fromTo('.expTextStagger',
      { opacity: 0, y: 80, x: 30 },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.2,
        scrollTrigger: {
          trigger: '.experienceContentRef',
          start: 'top 70%'
        }
      }
    );

    // 7. Features Section (Nova Seção de Benefícios - Textos Parallax Scrub)
    gsap.fromTo('.featuresTextRef > *',
      { opacity: 0, y: 100 },
      {
        opacity: 1,
        y: 0,
        ease: 'power4.out',
        stagger: 0.2, // O título e o parágrafo sobem separadamente
        scrollTrigger: {
          trigger: '.featuresSectionRef',
          start: 'top 90%',
          end: 'top 40%',
          scrub: 1.5, // Parallax ativado com inércia de 1.5s
        }
      }
    );

    gsap.fromTo('.featureCardRef',
      { opacity: 0, y: 50, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'back.out(1.7)',
        stagger: 0.2,
        scrollTrigger: {
          trigger: '.featuresSectionRef',
          start: 'top 70%'
        }
      }
    );

    // 8. FAQ Section
    gsap.fromTo('.faqHeaderRef',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.faqSectionRef',
          start: 'top 80%'
        }
      }
    );

    gsap.fromTo('.faqItemRef',
      { opacity: 0, x: -50 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: '.faqSectionRef',
          start: 'top 75%',
          end: 'top 30%',
          scrub: 1, // Efeito parallax amarrado ao scroll
        }
      }
    );

    // 9. CTA Section (Vídeo)
    gsap.fromTo('.ctaGlassBoxRef',
      { opacity: 0, scale: 0.9, y: 30 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.2,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: '.ctaSectionRef',
          start: 'top 80%'
        }
      }
    );

  }, { scope: containerRef });

  return (
    <main className={styles.main} ref={containerRef}>
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Background Video */}
        <div className={styles.videoBackground}>
          <div className={styles.videoOverlay}></div>
          <video 
            ref={video1Ref}
            src="/VIDEO1-HERO.mp4" 
            autoPlay 
            muted 
            playsInline 
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            className={`${styles.heroVideo} ${activeVideo === 1 ? styles.videoActive : styles.videoHidden}`}
            onEnded={() => handleVideoEnded(2, video2Ref)}
          />
          <video 
            ref={video2Ref}
            src="/VIDEO2-HERO.mp4" 
            muted 
            playsInline 
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            className={`${styles.heroVideo} ${activeVideo === 2 ? styles.videoActive : styles.videoHidden}`}
            onEnded={() => handleVideoEnded(1, video1Ref)}
          />
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
              <label className={styles.searchLabel}>LOCALIZAÇÃO</label>
              <input 
                type="text" 
                placeholder="Ex: Garopaba, SC" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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
                  { value: 'Apartamento', label: 'Apartamento' },
                  { value: 'Cobertura', label: 'Cobertura' },
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
                  { value: '0-5', label: 'Até R$ 5M' },
                  { value: '5-10', label: 'R$ 5M - R$ 10M' },
                  { value: '10-20', label: 'R$ 10M - R$ 20M' },
                  { value: '20+', label: 'Acima de R$ 20M' }
                ]}
              />
            </div>
            
            <button type="button" className={styles.searchButton} onClick={handleQuickSearch}>
              <Search size={24} color="white" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </section>


      {/* Global Network Section */}
      <section className={`${styles.globalNetworkSection} globalNetworkRef`}>
        <div className={styles.globalNetworkContainer}>
          <div className={styles.globalNetworkContent}>
            <span className={styles.globalSubtitle}>EXCLUSIVIDADE & CONHECIMENTO LOCAL</span>
            <h2 className={styles.globalTitle}>O luxo de encontrar o refúgio perfeito com quem respira Garopaba...</h2>
            <p className={styles.globalDescription}>
              Nascemos com um propósito claro: conectar você às propriedades mais espetaculares e reservadas de Santa Catarina. Nossa curadoria exclusiva e profundo conhecimento local garantem que sua experiência no mercado de alto padrão em Garopaba seja impecável, do início ao fim.
            </p>
            
            <a href="#" className={styles.globalLink}>
              Conheça Garopaba <ArrowRight size={24} className={styles.globalLinkIcon} />
            </a>

            <div className={styles.globalStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>100%</span>
                <span className={styles.statLabel}>curadoria de alto padrão</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>+50</span>
                <span className={styles.statLabel}>imóveis selecionados</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>01</span>
                <span className={styles.statLabel}>região exclusiva atendida</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>24h</span>
                <span className={styles.statLabel}>atendimento premium</span>
              </div>
            </div>
          </div>
          
          <div className={styles.globalNetworkVideo}>
            <video 
              src="/VIDEOSEÇÃO2.mp4" 
              autoPlay 
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
              <button onClick={() => scrollPropertyGrid('left')} className={styles.carouselBtn} aria-label="Anterior">
                <ChevronLeft size={24} />
              </button>
              <button onClick={() => scrollPropertyGrid('right')} className={styles.carouselBtn} aria-label="Próximo">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
          
          <div className={`${styles.propertyGrid} propertyGridRef`} ref={propertyGridRef}>
            {featuredProperties.map(property => (
              <Link href={`/imoveis/${property.id}`} key={property.id} className={`${styles.propertyCard} propertyCardRef`}>
                <div className={styles.cardImageWrapper} style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image 
                    src={property.photos && property.photos.length > 0 ? property.photos[0] : '/placeholder.jpg'} 
                    alt={property.title} 
                    className={styles.cardImage} 
                    fill
                    unoptimized
                    style={{objectFit:'cover'}}
                  />
                  <div className={styles.cardOverlay}></div>
                </div>
                <div className={styles.cardTop}>
                  <span className={styles.statusBadge}>
                    {property.status === 'SOLD' ? 'Vendido' : property.status === 'RENTED' ? 'Alugado' : property.transactionType === 'SALE' ? 'À Venda' : property.transactionType === 'RENT' ? 'Aluguel' : 'Lançamento'}
                  </span>
                </div>
                {property.status === 'AVAILABLE' && (
                  <div className={styles.cardBottom}>
                    <h3 className={styles.propertyPrice}>
                      {(() => {
                        if (property.transactionType === 'RENT') {
                          return property.rentPrice 
                            ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.rentPrice)}/mês`
                            : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price);
                        }
                        // SALE ou LANCAMENTO: usa price, mas se price for 0, tenta rentPrice
                        if (property.price > 0) {
                          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price);
                        }
                        if (property.rentPrice && property.rentPrice > 0) {
                          return `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.rentPrice)}/mês`;
                        }
                        return 'Sob Consulta';
                      })()}
                    </h3>
                    <p className={styles.propertyAddress}>{property.location}</p>
                    <div className={styles.propertyFeatures}>
                      <span className={styles.featureItem}>{property.suites || property.bedrooms || 0} QUARTOS</span>
                      <span className={styles.featureItem}>{property.bathrooms || 0} BANHEIROS</span>
                      <span className={styles.featureItem}>{property.areaTotal || 0} M²</span>
                    </div>
                  </div>
                )}
                {property.status !== 'AVAILABLE' && (
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
              CURADORIA ARQUITETÔNICA
            </span>
            
            <h2 className={`${styles.experienceTitle} expTextStagger`}>
              Projetos que Redefinem o<br /><span>Alto Padrão em Garopaba</span>
            </h2>
            
            <p className={`${styles.experienceDescription} expTextStagger`}>
              Nossa seleção de imóveis vai além do convencional. Cada propriedade é escolhida meticulosamente por seu design arrojado, integração perfeita com a natureza deslumbrante de Santa Catarina e acabamentos estritamente premium.
            </p>
            
            <ul className={styles.experienceList}>
              <li className="expTextStagger">
                <span className={styles.checkIcon}>✔</span>
                Design contemporâneo assinado por escritórios renomados.
              </li>
              <li className="expTextStagger">
                <span className={styles.checkIcon}>✔</span>
                Luz natural abundante e ventilação cruzada de frente para o mar.
              </li>
              <li className="expTextStagger">
                <span className={styles.checkIcon}>✔</span>
                Materiais nobres: pedras naturais, madeiras de lei e esquadrias termoacústicas.
              </li>
            </ul>

            <div className="expTextStagger">
              <Link href="/projetos" className={styles.exploreButton}>
                Explorar Todos os Projetos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Benefits Section */}
      <section className={`${styles.featuresSection} featuresSectionRef`}>
        <div className={styles.featuresContainer}>
          <div className={`${styles.featuresText} featuresTextRef`}>
            <h2>Exclusividade &<br />Alta Performance</h2>
            <p>
              A Golden Garopaba eleva o padrão de negociações imobiliárias em Santa Catarina. Sob a curadoria de Rafael Jesse, garantimos discrição absoluta, inteligência de mercado e acesso restrito às propriedades mais extraordinárias do litoral.
            </p>
          </div>
          
          <div className={`${styles.featuresGrid} featuresGridRef`}>
            <div className={`${styles.featureCard} featureCardRef`}>
              <Headphones size={48} className={styles.featureIcon} />
              <h3>Suporte 24/7</h3>
              <p>Nossa equipe está sempre disponível para auxiliar com todas as suas necessidades.</p>
            </div>
            <div className={`${styles.featureCard} featureCardRef`}>
              <Star size={48} className={styles.featureIcon} />
              <h3>Seleção Premium</h3>
              <p>Acesso às propriedades de luxo mais exclusivas de Garopaba e região.</p>
            </div>
            <div className={`${styles.featureCard} featureCardRef`}>
              <BadgeCheck size={48} className={styles.featureIcon} />
              <h3>Imóveis Verificados</h3>
              <p>Cada propriedade é minuciosamente inspecionada e verificada para garantir autenticidade.</p>
            </div>
            <div className={`${styles.featureCard} featureCardRef`}>
              <Shield size={48} className={styles.featureIcon} />
              <h3>Transações Seguras</h3>
              <p>Seu investimento é protegido por nosso sistema jurídico e administrativo blindado.</p>
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
                  <button className={styles.faqToggleBtn}>
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
  );
}
