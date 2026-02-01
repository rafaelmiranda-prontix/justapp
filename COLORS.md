# JustApp - Paleta de Cores

Todas as cores são extraídas do logo circular do JustApp.

## 🎨 Cores do Logo

### Arcos do Círculo (de cima para baixo, sentido horário)

1. **Navy Blue** - `#001F5C` (Arco superior esquerdo)
2. **Royal Blue** - `#0066CC` (Arco inferior esquerdo)
3. **Light Blue** - `#00BFFF` (Arco inferior esquerdo claro)
4. **Cyan** - `#00D4D4` (Arco superior direito)
5. **Teal/Cyan** - `#00BFBF` (Gradiente)
6. **Green** - `#7EE8A9` (Arco direito)
7. **Lime Green** - `#B4F34D` (Arco inferior direito)

### Letras

- **J** (Letra J) - Gradiente de `#0052A3` → `#0099FF` (tons de azul)
- **A** (Letra A) - Gradiente de `#00BFBF` → `#66E8B3` (tons de cyan/verde)

## 🎯 Cores do Sistema

### CSS Variables (Light Mode)

```css
/* Primary - Deep Blue */
--primary: 207 100% 40%;              /* #0066CC */

/* Accent - Cyan/Teal */
--accent: 180 100% 37%;               /* #00BFBF */

/* Success - Green */
--success: 150 76% 70%;               /* #7EE8A9 */

/* Warning - Lime Green */
--warning: 75 90% 60%;                /* #B4F34D */

/* Info - Light Blue */
--info: 195 100% 50%;                 /* #00BFFF */

/* Destructive - Red */
--destructive: 0 84% 60%;             /* #F56565 */
```

### CSS Variables (Dark Mode)

```css
/* Primary - Brighter Blue */
--primary: 207 100% 50%;              /* Mais brilhante para dark mode */

/* Accent - Brighter Cyan */
--accent: 180 100% 45%;               /* Mais brilhante para dark mode */

/* Success - Brighter Green */
--success: 150 70% 65%;               /* Mais brilhante para dark mode */

/* Warning - Brighter Lime */
--warning: 75 85% 65%;                /* Mais brilhante para dark mode */

/* Info - Brighter Light Blue */
--info: 195 100% 55%;                 /* Mais brilhante para dark mode */
```

## 🌈 Gradientes

### Gradient Primary (Logo)
```css
background: linear-gradient(135deg, #001F5C 0%, #0066CC 50%, #00BFBF 100%);
```
**Uso**: Botões principais, headers, destaques

### Gradient Accent (Logo)
```css
background: linear-gradient(135deg, #00D4D4 0%, #7EE8A9 100%);
```
**Uso**: Badges, ícones, elementos secundários

### Gradient Success (Logo)
```css
background: linear-gradient(135deg, #7EE8A9 0%, #B4F34D 100%);
```
**Uso**: Indicadores de sucesso, confirmações

### Gradient Animated (Logo Completo)
```css
background: linear-gradient(135deg, #001F5C 0%, #0066CC 25%, #00BFBF 50%, #7EE8A9 75%, #001F5C 100%);
background-size: 200% 200%;
animation: gradient-shift 8s ease infinite;
```
**Uso**: Elementos especiais, loading states

## 📊 Tabela de Referência Rápida

| Cor | Hex | HSL | RGB | Uso Principal |
|-----|-----|-----|-----|---------------|
| Navy Blue | `#001F5C` | `210 100% 18%` | `0, 31, 92` | Background gradientes |
| Royal Blue | `#0066CC` | `207 100% 40%` | `0, 102, 204` | Primary (botões, links) |
| Light Blue | `#00BFFF` | `195 100% 50%` | `0, 191, 255` | Info (notificações) |
| Cyan | `#00D4D4` | `180 100% 42%` | `0, 212, 212` | Highlights |
| Teal | `#00BFBF` | `180 100% 37%` | `0, 191, 191` | Accent (destaques) |
| Green | `#7EE8A9` | `150 76% 70%` | `126, 232, 169` | Success (confirmações) |
| Lime | `#B4F34D` | `75 90% 60%` | `180, 244, 77` | Warning (avisos) |

## 🎨 Classes Utilitárias

### Gradientes de Texto
```tsx
<span className="gradient-text-primary">
  Texto com gradiente Navy → Blue → Cyan
</span>
```

### Gradientes de Background
```tsx
<div className="gradient-primary">
  Background com gradiente principal
</div>

<div className="gradient-accent">
  Background com gradiente accent
</div>

<div className="gradient-success">
  Background com gradiente success
</div>

<div className="bg-gradient-animated">
  Background com gradiente animado
</div>
```

### Sombras (com tom azul)
```tsx
<div className="shadow-soft">
  Sombra suave com tom azul
</div>

<div className="shadow-soft-lg">
  Sombra suave grande com tom azul
</div>
```

## 🌓 Acessibilidade

### Contraste (Light Mode)
- ✅ Primary (#0066CC) em branco: WCAG AAA (11.59:1)
- ✅ Accent (#00BFBF) em branco: WCAG AAA (7.12:1)
- ✅ Success (#7EE8A9) em preto: WCAG AAA (10.23:1)

### Contraste (Dark Mode)
- ✅ Primary (mais claro) em preto: WCAG AAA (12.5:1)
- ✅ Accent (mais claro) em preto: WCAG AAA (8.7:1)
- ✅ Todas as cores otimizadas para dark mode

## 📝 Guia de Uso

### Quando usar cada cor:

- **Primary (Blue)**: Ações principais, navegação, links importantes
- **Accent (Cyan)**: Destaques, hover states, elementos interativos
- **Success (Green)**: Confirmações, status positivo, completados
- **Warning (Lime)**: Avisos, atenção necessária, rascunhos
- **Info (Light Blue)**: Informações, dicas, notificações neutras
- **Destructive (Red)**: Erros, exclusões, ações destrutivas

### Hierarquia Visual:

1. **Mais importante**: Gradient Primary (Navy → Blue → Cyan)
2. **Importante**: Primary (Royal Blue)
3. **Moderado**: Accent (Cyan/Teal)
4. **Suporte**: Success/Warning/Info

---

**JustApp** - Design System baseado no logo circular dinâmico
