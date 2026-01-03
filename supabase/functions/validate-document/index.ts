import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validação estrutural de CPF
function validateCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  
  if (cleanCpf.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
  
  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
  
  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
  
  return true;
}

// Validação estrutural de CNPJ
function validateCNPJ(cnpj: string): boolean {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  
  if (cleanCnpj.length !== 14) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;
  
  // Validar primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCnpj.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCnpj.charAt(12))) return false;
  
  // Validar segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCnpj.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCnpj.charAt(13))) return false;
  
  return true;
}

// Validação externa via BrasilAPI
async function validateDocumentExternal(
  documentType: 'cpf' | 'cnpj',
  documentValue: string,
  providedName: string
): Promise<{ valid: boolean; message: string; data?: any }> {
  const cleanDocument = documentValue.replace(/\D/g, '');
  
  try {
    if (documentType === 'cnpj') {
      // Consultar CNPJ na BrasilAPI
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanDocument}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return { valid: false, message: 'CNPJ não encontrado na base da Receita Federal.' };
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('BrasilAPI CNPJ response:', JSON.stringify(data));
      
      // Verificar se está ativo
      if (data.situacao_cadastral && data.situacao_cadastral !== 2) {
        return { 
          valid: false, 
          message: `CNPJ com situação cadastral irregular: ${data.descricao_situacao_cadastral || 'Inativo'}` 
        };
      }
      
      // Verificar compatibilidade do nome/razão social (comparação básica)
      const razaoSocial = (data.razao_social || '').toLowerCase().trim();
      const nomeFantasia = (data.nome_fantasia || '').toLowerCase().trim();
      const providedNameLower = providedName.toLowerCase().trim();
      
      // Verificação mais flexível - pelo menos algumas palavras devem coincidir
      const providedWords = providedNameLower.split(/\s+/).filter(w => w.length > 2);
      const razaoWords = razaoSocial.split(/\s+/).filter((w: string) => w.length > 2);
      const fantasiaWords = nomeFantasia.split(/\s+/).filter((w: string) => w.length > 2);
      
      const hasMatchingWord = providedWords.some((word: string) => 
        razaoWords.includes(word) || fantasiaWords.includes(word)
      );
      
      // Se não houver nenhuma correspondência e o nome fornecido é significativamente diferente
      if (!hasMatchingWord && providedNameLower.length > 5 && razaoSocial.length > 5) {
        console.log('Name mismatch warning:', { providedName, razaoSocial, nomeFantasia });
        // Apenas log, não bloqueia - o usuário pode ter digitado diferente
      }
      
      return { 
        valid: true, 
        message: 'CNPJ válido e ativo.',
        data: {
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          situacao: data.descricao_situacao_cadastral
        }
      };
    } else {
      // Para CPF, a BrasilAPI não oferece consulta gratuita
      // Retornamos válido após a validação estrutural, já que não há API gratuita confiável
      console.log('CPF validation: structural validation passed, no external API available');
      return { 
        valid: true, 
        message: 'CPF estruturalmente válido. Validação externa não disponível para CPF.',
        data: { note: 'Validação externa de CPF não disponível via API gratuita.' }
      };
    }
  } catch (error) {
    console.error('External validation error:', error);
    // Se a API externa falhar, bloqueamos o cadastro conforme regra de negócio
    return { 
      valid: false, 
      message: 'Não foi possível validar o documento neste momento. Tente novamente mais tarde.' 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentType, documentValue, name } = await req.json();
    
    console.log('Validating document:', { documentType, documentValue: documentValue?.substring(0, 4) + '***' });
    
    // Validar inputs
    if (!documentType || !documentValue) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Tipo de documento e valor são obrigatórios.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (documentType !== 'cpf' && documentType !== 'cnpj') {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Tipo de documento inválido. Use "cpf" ou "cnpj".' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Camada 1: Validação estrutural
    const cleanDocument = documentValue.replace(/\D/g, '');
    let structuralValid = false;
    
    if (documentType === 'cpf') {
      structuralValid = validateCPF(cleanDocument);
      if (!structuralValid) {
        console.log('CPF structural validation failed');
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'CPF inválido. Verifique os dígitos informados.',
            layer: 'structural'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      structuralValid = validateCNPJ(cleanDocument);
      if (!structuralValid) {
        console.log('CNPJ structural validation failed');
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: 'CNPJ inválido. Verifique os dígitos informados.',
            layer: 'structural'
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    console.log('Structural validation passed, proceeding to external validation');
    
    // Camada 2: Validação externa
    const externalResult = await validateDocumentExternal(documentType, cleanDocument, name || '');
    
    if (!externalResult.valid) {
      console.log('External validation failed:', externalResult.message);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: externalResult.message,
          layer: 'external'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('Document validation successful');
    
    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: externalResult.message,
        data: externalResult.data
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error) {
    console.error('Error in validate-document:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Erro interno ao validar documento.' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
