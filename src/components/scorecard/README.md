# ScoreCard Component

A flexible and reusable ScoreCard component for displaying key metrics and data in your React application.

## Features

- **Flexible Data Support**: Display single or multiple data points
- **Multiple Variants**: Default, compact, and detailed display modes
- **Trend Indicators**: Show positive/negative trends with percentages
- **Icon Support**: Include custom icons with your data
- **Color Themes**: Built-in color variants (blue, green, red, yellow, purple, gray)
- **Responsive Design**: Works on all screen sizes
- **TypeScript Support**: Fully typed for better development experience

## Usage

### Basic Usage

```tsx
import ScoreCard, { ScoreCardData } from '@/components/scorecard/ScoreCard';
import { FaDollarSign } from 'react-icons/fa';

const data: ScoreCardData = {
  value: '$24,500',
  label: 'Monthly Revenue',
  trend: {
    value: 12.5,
    isPositive: true,
    period: 'vs last month',
  },
  icon: <FaDollarSign />,
  color: 'green',
};

function Dashboard() {
  return <ScoreCard title="Revenue Overview" data={data} />;
}
```

### Multiple Data Points

```tsx
const multipleData: ScoreCardData[] = [
  {
    value: '1,234',
    label: 'Total Customers',
    trend: { value: 8.3, isPositive: true },
    icon: <FaUsers />,
    color: 'blue',
  },
  {
    value: '456',
    label: 'Active Orders',
    trend: { value: 3.2, isPositive: false },
    icon: <FaShoppingCart />,
    color: 'yellow',
  },
];

<ScoreCard title="Business Overview" data={multipleData} />;
```

### Variants

```tsx
// Compact variant
<ScoreCard
  title="Quick Stats"
  data={data}
  variant="compact"
/>

// Detailed variant
<ScoreCard
  title="Detailed Analytics"
  data={data}
  variant="detailed"
/>
```

## Props

### ScoreCardProps

| Prop        | Type                                   | Default     | Description                                 |
| ----------- | -------------------------------------- | ----------- | ------------------------------------------- |
| `title`     | `string`                               | -           | The title displayed at the top of the card  |
| `data`      | `ScoreCardData \| ScoreCardData[]`     | -           | Single data object or array of data objects |
| `className` | `string`                               | `''`        | Additional CSS classes                      |
| `variant`   | `'default' \| 'compact' \| 'detailed'` | `'default'` | Display variant                             |

### ScoreCardData

| Prop    | Type                                                           | Default  | Description                  |
| ------- | -------------------------------------------------------------- | -------- | ---------------------------- |
| `value` | `string \| number`                                             | -        | The main value to display    |
| `label` | `string`                                                       | -        | Optional label for the value |
| `trend` | `TrendData`                                                    | -        | Optional trend information   |
| `icon`  | `React.ReactNode`                                              | -        | Optional icon component      |
| `color` | `'blue' \| 'green' \| 'red' \| 'yellow' \| 'purple' \| 'gray'` | `'gray'` | Color theme                  |

### TrendData

| Prop         | Type      | Default | Description                                         |
| ------------ | --------- | ------- | --------------------------------------------------- |
| `value`      | `number`  | -       | Percentage change value                             |
| `isPositive` | `boolean` | -       | Whether the trend is positive or negative           |
| `period`     | `string`  | -       | Optional period description (e.g., "vs last month") |

## Examples

See `ScoreCardExamples.tsx` for comprehensive usage examples including:

- Single data point cards
- Multiple data point cards
- All three variants (default, compact, detailed)
- Different color themes
- Trend indicators
- Icon integration

## Styling

The component uses Tailwind CSS classes and follows the project's design system. It includes:

- Responsive design patterns
- Consistent spacing and typography
- Accessible color contrasts
- Smooth transitions and hover effects

## Integration

The ScoreCard component is designed to work seamlessly with:

- Next.js applications
- TypeScript projects
- Tailwind CSS styling
- React Icons library
- Your existing design system
