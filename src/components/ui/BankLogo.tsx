import { CreditCard } from "lucide-react";
import { bancosUnicos, bandeirasCartao } from "@/data/bancosBrasileiros";

// URLs dos logos dos bancos (CDN público)
const bankLogoUrls: Record<string, string> = {
  "Banco do Brasil": "https://logodownload.org/wp-content/uploads/2014/05/banco-do-brasil-logo-1.png",
  "Santander": "https://logodownload.org/wp-content/uploads/2014/05/santander-logo-2.png",
  "Caixa Econômica Federal": "https://logodownload.org/wp-content/uploads/2014/05/caixa-economica-federal-logo.png",
  "Bradesco": "https://logodownload.org/wp-content/uploads/2014/05/bradesco-logo-1.png",
  "Itaú Unibanco": "https://logodownload.org/wp-content/uploads/2014/05/itau-logo-2.png",
  "Nubank": "https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-1.png",
  "Inter": "https://logodownload.org/wp-content/uploads/2019/07/banco-inter-logo.png",
  "C6 Bank": "https://logodownload.org/wp-content/uploads/2020/02/c6-bank-logo.png",
  "Banco Original": "https://logodownload.org/wp-content/uploads/2017/11/banco-original-logo.png",
  "Sicoob": "https://logodownload.org/wp-content/uploads/2018/10/sicoob-logo.png",
  "Sicredi": "https://logodownload.org/wp-content/uploads/2018/10/sicredi-logo.png",
  "Banrisul": "https://logodownload.org/wp-content/uploads/2014/05/banrisul-logo.png",
  "Safra": "https://logodownload.org/wp-content/uploads/2014/05/banco-safra-logo.png",
  "BTG Pactual": "https://logodownload.org/wp-content/uploads/2014/05/btg-pactual-logo.png",
  "PagBank (PagSeguro)": "https://logodownload.org/wp-content/uploads/2019/09/pagbank-logo.png",
  "PicPay": "https://logodownload.org/wp-content/uploads/2018/05/picpay-logo.png",
  "Mercado Pago": "https://logodownload.org/wp-content/uploads/2021/02/mercado-pago-logo.png",
  "Banco Pan": "https://logodownload.org/wp-content/uploads/2014/05/banco-panamericano-logo.png",
  "Banco Votorantim (BV)": "https://logodownload.org/wp-content/uploads/2019/09/bv-financeira-logo.png",
  "Banco Neon": "https://logodownload.org/wp-content/uploads/2019/06/neon-logo.png",
  "XP Investimentos": "https://logodownload.org/wp-content/uploads/2017/11/xp-investimentos-logo.png",
  "Stone Pagamentos": "https://logodownload.org/wp-content/uploads/2019/09/stone-logo.png",
  "Banco BMG": "https://logodownload.org/wp-content/uploads/2019/08/banco-bmg-logo.png",
  "Banco da Amazônia": "https://logodownload.org/wp-content/uploads/2019/09/banco-amazonia-logo.png",
  "Banco do Nordeste": "https://logodownload.org/wp-content/uploads/2019/09/banco-do-nordeste-logo.png",
  "BRB - Banco de Brasília": "https://logodownload.org/wp-content/uploads/2019/09/brb-logo.png",
  "Banco Daycoval": "https://logodownload.org/wp-content/uploads/2019/09/daycoval-logo.png",
  "Banco Sofisa Direto": "https://logodownload.org/wp-content/uploads/2019/09/sofisa-direto-logo.png",
  "Citibank": "https://logodownload.org/wp-content/uploads/2014/05/citibank-logo.png",
  "HSBC": "https://logodownload.org/wp-content/uploads/2014/05/hsbc-logo.png",
};

// URLs dos logos das bandeiras de cartão
const cardBrandLogoUrls: Record<string, string> = {
  "visa": "https://logodownload.org/wp-content/uploads/2016/10/visa-logo-1.png",
  "mastercard": "https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo-1.png",
  "elo": "https://logodownload.org/wp-content/uploads/2017/04/elo-logo.png",
  "amex": "https://logodownload.org/wp-content/uploads/2014/04/american-express-logo.png",
  "hipercard": "https://logodownload.org/wp-content/uploads/2017/04/hipercard-logo.png",
  "diners": "https://logodownload.org/wp-content/uploads/2014/04/diners-club-logo.png",
  "alelo": "https://logodownload.org/wp-content/uploads/2017/04/alelo-logo.png",
  "sodexo": "https://logodownload.org/wp-content/uploads/2017/04/sodexo-logo.png",
  "ticket": "https://logodownload.org/wp-content/uploads/2017/04/ticket-logo.png",
  "vr": "https://logodownload.org/wp-content/uploads/2017/04/vr-logo.png",
};

interface BankLogoProps {
  bankName?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  showFallback?: boolean;
  className?: string;
}

interface CardBrandLogoProps {
  brandId?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  showFallback?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "w-5 h-5",
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const textSizeClasses = {
  xs: "text-[6px]",
  sm: "text-[8px]",
  md: "text-xs",
  lg: "text-sm",
};

export const BankLogo = ({ 
  bankName, 
  size = "md", 
  showFallback = true,
  className = ""
}: BankLogoProps) => {
  if (!bankName) {
    if (!showFallback) return null;
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-muted flex items-center justify-center ${className}`}>
        <CreditCard className="w-1/2 h-1/2 text-muted-foreground" />
      </div>
    );
  }

  const bancoInfo = bancosUnicos.find(b => b.nome === bankName);
  const logoUrl = bankLogoUrls[bankName];

  if (logoUrl) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-md ${className}`}
      >
        <img 
          src={logoUrl} 
          alt={bankName}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Fallback para código do banco se imagem falhar
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && bancoInfo) {
              parent.style.backgroundColor = bancoInfo.cor;
              parent.innerHTML = `<span style="color: ${bancoInfo.corTexto}" class="${textSizeClasses[size]} font-bold">${bancoInfo.codigo}</span>`;
            }
          }}
        />
      </div>
    );
  }

  // Fallback para código colorido
  if (bancoInfo) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-md ${className}`}
        style={{ 
          backgroundColor: bancoInfo.cor,
          color: bancoInfo.corTexto
        }}
      >
        <span className={`${textSizeClasses[size]} font-bold`}>{bancoInfo.codigo}</span>
      </div>
    );
  }

  // Fallback genérico
  if (!showFallback) return null;
  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-muted flex items-center justify-center ${className}`}>
      <CreditCard className="w-1/2 h-1/2 text-muted-foreground" />
    </div>
  );
};

export const CardBrandLogo = ({ 
  brandId, 
  size = "md", 
  showFallback = true,
  className = ""
}: CardBrandLogoProps) => {
  if (!brandId) {
    if (!showFallback) return null;
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-muted flex items-center justify-center ${className}`}>
        <CreditCard className="w-1/2 h-1/2 text-muted-foreground" />
      </div>
    );
  }

  const brandInfo = bandeirasCartao.find(b => b.id === brandId.toLowerCase());
  const logoUrl = cardBrandLogoUrls[brandId.toLowerCase()];

  if (logoUrl) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center overflow-hidden bg-white shadow-md ${className}`}
      >
        <img 
          src={logoUrl} 
          alt={brandInfo?.nome || brandId}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Fallback para nome da bandeira se imagem falhar
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && brandInfo) {
              parent.style.backgroundColor = brandInfo.cor;
              parent.innerHTML = `<span style="color: ${brandInfo.corTexto}" class="${textSizeClasses[size]} font-bold">${brandInfo.nome.slice(0, 4).toUpperCase()}</span>`;
            }
          }}
        />
      </div>
    );
  }

  // Fallback para cores da bandeira
  if (brandInfo) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg flex items-center justify-center shadow-md ${className}`}
        style={{ 
          backgroundColor: brandInfo.cor,
          color: brandInfo.corTexto
        }}
      >
        <span className={`${textSizeClasses[size]} font-bold text-center leading-tight`}>
          {brandInfo.nome.slice(0, 4).toUpperCase()}
        </span>
      </div>
    );
  }

  // Fallback genérico
  if (!showFallback) return null;
  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-muted flex items-center justify-center ${className}`}>
      <CreditCard className="w-1/2 h-1/2 text-muted-foreground" />
    </div>
  );
};

export default BankLogo;
