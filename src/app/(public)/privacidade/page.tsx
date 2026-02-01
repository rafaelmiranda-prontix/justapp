import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de privacidade e proteção de dados da plataforma JustApp',
}

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo-icon.svg" alt="JustApp" className="h-6 w-6" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] bg-clip-text text-transparent">
                JustApp
              </span>
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <CardTitle className="text-3xl">Política de Privacidade</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introdução</h2>
                <p>
                  O JustApp está comprometido com a proteção da privacidade e dos dados pessoais de nossos
                  usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e
                  protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados
                  (LGPD - Lei nº 13.709/2018).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Informações que Coletamos</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">2.1. Informações Fornecidas por Você</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Nome completo</li>
                      <li>Endereço de e-mail</li>
                      <li>Número de telefone (opcional)</li>
                      <li>Informações de perfil (para advogados: OAB, especialidades, localização)</li>
                      <li>Informações sobre casos jurídicos (quando você cria um caso)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">2.2. Informações Coletadas Automaticamente</h3>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Endereço IP</li>
                      <li>Tipo de navegador e dispositivo</li>
                      <li>Páginas visitadas e tempo de permanência</li>
                      <li>Cookies e tecnologias similares</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Como Usamos suas Informações</h2>
                <div className="space-y-2">
                  <p>
                    Utilizamos suas informações pessoais para os seguintes fins:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Fornecer e melhorar nossos serviços</li>
                    <li>Conectar cidadãos com advogados adequados</li>
                    <li>Processar transações e gerenciar contas</li>
                    <li>Enviar comunicações relacionadas ao serviço</li>
                    <li>Analisar o uso da plataforma para melhorias</li>
                    <li>Cumprir obrigações legais</li>
                    <li>Prevenir fraudes e garantir segurança</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Compartilhamento de Informações</h2>
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">4.1.</strong> Compartilhamos informações apenas nas
                    seguintes situações:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>
                      <strong className="text-foreground">Com advogados:</strong> Quando você cria um caso, suas
                      informações relevantes são compartilhadas com advogados compatíveis para facilitar a
                      conexão.
                    </li>
                    <li>
                      <strong className="text-foreground">Prestadores de serviço:</strong> Podemos compartilhar
                      com empresas que nos ajudam a operar a plataforma (hospedagem, análise, pagamentos),
                      sempre sob contratos de confidencialidade.
                    </li>
                    <li>
                      <strong className="text-foreground">Obrigações legais:</strong> Quando exigido por lei ou
                      ordem judicial.
                    </li>
                    <li>
                      <strong className="text-foreground">Com seu consentimento:</strong> Em outras situações,
                      apenas com sua autorização explícita.
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Cookies e Tecnologias Similares</h2>
                <p>
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência, analisar o tráfego
                  do site e personalizar conteúdo. Você pode gerenciar suas preferências de cookies através do
                  banner de cookies ou nas configurações do seu navegador.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Segurança dos Dados</h2>
                <p>
                  Implementamos medidas técnicas e organizacionais adequadas para proteger suas informações
                  pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui
                  criptografia, controles de acesso e monitoramento regular de segurança.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Retenção de Dados</h2>
                <p>
                  Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos
                  descritos nesta política, a menos que um período de retenção mais longo seja exigido ou
                  permitido por lei.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Seus Direitos (LGPD)</h2>
                <p className="mb-2">De acordo com a LGPD, você tem os seguintes direitos:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>
                    <strong className="text-foreground">Confirmação e acesso:</strong> Saber se tratamos seus
                    dados e acessá-los
                  </li>
                  <li>
                    <strong className="text-foreground">Correção:</strong> Solicitar a correção de dados
                    incompletos ou desatualizados
                  </li>
                  <li>
                    <strong className="text-foreground">Anonimização ou eliminação:</strong> Solicitar a
                    anonimização ou exclusão de dados desnecessários
                  </li>
                  <li>
                    <strong className="text-foreground">Portabilidade:</strong> Solicitar a portabilidade de
                    seus dados
                  </li>
                  <li>
                    <strong className="text-foreground">Revogação do consentimento:</strong> Revogar seu
                    consentimento a qualquer momento
                  </li>
                  <li>
                    <strong className="text-foreground">Oposição:</strong> Opor-se ao tratamento de dados em
                    certas circunstâncias
                  </li>
                </ul>
                <p className="mt-3">
                  Para exercer seus direitos, entre em contato conosco através dos canais de suporte disponíveis
                  na plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Privacidade de Menores</h2>
                <p>
                  Nossos serviços são destinados a pessoas com 18 anos ou mais. Não coletamos intencionalmente
                  informações pessoais de menores de idade. Se tomarmos conhecimento de que coletamos dados de um
                  menor, tomaremos medidas para excluir essas informações.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Alterações nesta Política</h2>
                <p>
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre
                  alterações significativas publicando a nova política nesta página e atualizando a data de
                  "Última atualização".
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Encarregado de Proteção de Dados (DPO)</h2>
                <p>
                  Para questões relacionadas à proteção de dados pessoais, você pode entrar em contato com nosso
                  Encarregado de Proteção de Dados através dos canais de suporte disponíveis na plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">12. Contato</h2>
                <p>
                  Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos suas
                  informações pessoais, entre em contato conosco através dos canais de suporte disponíveis na
                  plataforma.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/termos" className="hover:text-foreground hover:underline">
            Termos de Uso
          </Link>
          <span>•</span>
          <Link href="/" className="hover:text-foreground hover:underline">
            Página Inicial
          </Link>
        </div>
      </main>
    </div>
  )
}
