'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'

// Este é um componente provisório (Mock) que desenha uma planta baixa 3D usando blocos.
// Quando tivermos o arquivo .glb do arquiteto, basta substituí-lo aqui usando useGLTF()
function FloorPlanPlaceholder() {
  return (
    <group>
      {/* Piso */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[10, 0.1, 8]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      
      {/* Parede Fundos */}
      <mesh castShadow receiveShadow position={[0, 1.5, -3.9]}>
        <boxGeometry args={[10, 3, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Parede Esquerda */}
      <mesh castShadow receiveShadow position={[-4.9, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Parede Divisória Interna */}
      <mesh castShadow receiveShadow position={[1, 1.5, 0]}>
        <boxGeometry args={[8, 3, 0.2]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Ilha da Cozinha */}
      <mesh castShadow receiveShadow position={[-2, 0.5, 1.5]}>
        <boxGeometry args={[3, 1, 1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Cama */}
      <mesh castShadow receiveShadow position={[3, 0.4, -2.5]}>
        <boxGeometry args={[2, 0.8, 2.5]} />
        <meshStandardMaterial color="#dcdcdc" />
      </mesh>
    </group>
  )
}

export default function InteractiveHouse() {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', cursor: 'grab' }}>
      <Canvas shadows camera={{ position: [8, 12, 12], fov: 35 }}>
        <Suspense fallback={null}>
          {/* Iluminação */}
          <ambientLight intensity={0.6} />
          <directionalLight castShadow position={[10, 20, 10]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
          
          {/* Planta Baixa */}
          <FloorPlanPlaceholder />
          
          {/* Sombra de Contato de Alta Qualidade */}
          <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.4} far={10} color="#000000" />
          
          {/* Controles de Câmera (Mouse/Touch) */}
          <OrbitControls 
            enablePan={false} /* Impede arrastar a câmera para fora da casa */
            enableZoom={true} /* Permite dar zoom na casa */
            minPolarAngle={Math.PI / 6} /* Limite de giro pra cima */
            maxPolarAngle={Math.PI / 2.2} /* Limite de giro pra baixo (não deixa ver por baixo da terra) */
            minDistance={8}
            maxDistance={25}
            autoRotate={true}
            autoRotateSpeed={0.5}
          />
          {/* Reflexos e luz de ambiente HDRI */}
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  )
}
