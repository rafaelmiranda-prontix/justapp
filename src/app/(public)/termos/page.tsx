import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Scale } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos e condições de uso da plataforma JustApp',
}

export default function TermosPage() {
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
            <CardTitle className="text-3xl mb-2">Termos de Uso</CardTitle>
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
                <p>
                  Ao acessar e usar a plataforma JustApp, você concorda em cumprir e estar vinculado a estes
                  Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve usar nossos
                  serviços.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Descrição do Serviço</h2>
                <p>
                  O JustApp é uma plataforma digital que conecta pessoas com problemas jurídicos a advogados
                  especializados. Nossa plataforma facilita a comunicação inicial entre cidadãos e profissionais
                  do direito, mas não constitui um escritório de advocacia nem oferece serviços jurídicos
                  diretamente.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Cadastro e Conta de Usuário</h2>
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">3.1.</strong> Para usar nossos serviços, você precisa criar
                    uma conta fornecendo informações precisas e atualizadas.
                  </p>
                  <p>
                    <strong className="text-foreground">3.2.</strong> Você é responsável por manter a
                    confidencialidade de suas credenciais de acesso e por todas as atividades que ocorram em sua
                    conta.
                  </p>
                  <p>
                    <strong className="text-foreground">3.3.</strong> Você concorda em notificar imediatamente o
                    JustApp sobre qualquer uso não autorizado de sua conta.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Uso da Plataforma</h2>
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">4.1.</strong> Você concorda em usar a plataforma apenas
                    para fins legais e de acordo com estes Termos.
                  </p>
                  <p>
                    <strong className="text-foreground">4.2.</strong> É proibido:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Usar a plataforma para atividades ilegais ou fraudulentas</li>
                    <li>Transmitir vírus, malware ou código malicioso</li>
                    <li>Tentar acessar áreas restritas da plataforma</li>
                    <li>Interferir no funcionamento normal da plataforma</li>
                    <li>Usar informações de outros usuários sem autorização</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Relação com Advogados</h2>
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">5.1.</strong> O JustApp atua como intermediário entre
                    cidadãos e advogados. Não somos parte do relacionamento jurídico estabelecido entre você e o
                    advogado.
                  </p>
                  <p>
                    <strong className="text-foreground">5.2.</strong> A contratação de serviços jurídicos é
                    realizada diretamente entre você e o advogado, sendo de responsabilidade exclusiva das
                    partes envolvidas.
                  </p>
                  <p>
                    <strong className="text-foreground">5.3.</strong> O JustApp não garante resultados específicos
                    em processos jurídicos nem se responsabiliza por decisões judiciais.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Propriedade Intelectual</h2>
                <p>
                  Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, ícones, imagens e software,
                  é propriedade do JustApp ou de seus licenciadores e está protegido por leis de direitos autorais
                  e outras leis de propriedade intelectual.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Limitação de Responsabilidade</h2>
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">7.1.</strong> O JustApp fornece a plataforma "como está"
                    e não garante que ela estará sempre disponível, segura ou livre de erros.
                  </p>
                  <p>
                    <strong className="text-foreground">7.2.</strong> Não nos responsabilizamos por danos
                    diretos, indiretos, incidentais ou consequenciais resultantes do uso ou impossibilidade de uso
                    da plataforma.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Modificações dos Termos</h2>
                <p>
                  Reservamos o direito de modificar estes Termos de Uso a qualquer momento. Alterações
                  significativas serão comunicadas aos usuários. O uso continuado da plataforma após as
                  modificações constitui aceitação dos novos termos.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Rescisão</h2>
                <p>
                  Podemos encerrar ou suspender sua conta e acesso à plataforma imediatamente, sem aviso prévio,
                  por qualquer motivo, incluindo violação destes Termos de Uso.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Lei Aplicável</h2>
                <p>
                  Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa será resolvida nos
                  tribunais competentes do Brasil.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Contato</h2>
                <p>
                  Para questões sobre estes Termos de Uso, entre em contato conosco através dos canais de
                  suporte disponíveis na plataforma.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/privacidade" className="hover:text-foreground hover:underline">
            Política de Privacidade
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
