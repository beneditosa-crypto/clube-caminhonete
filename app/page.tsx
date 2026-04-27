export default function Home() {
  return (
    <main style={{
      backgroundColor: '#0B0F14',
      color: '#fff',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      textAlign: 'center'
    }}>
      
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>
        Clube da Caminhonete
      </h1>

      <p style={{ color: '#aaa', marginBottom: 30 }}>
        Compra e venda de veículos clássicos com mais de 25 anos
      </p>

      <button style={{
        backgroundColor: '#1E90FF',
        border: 'none',
        padding: '15px 25px',
        borderRadius: 8,
        color: '#fff',
        fontSize: 16
      }}>
        Baixar o App
      </button>

      <p style={{ marginTop: 40, fontSize: 12, color: '#666' }}>
        Em breve disponível na App Store e Google Play
      </p>

    </main>
  );
}