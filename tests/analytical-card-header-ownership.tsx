import { useState } from "react"
import { createRoot } from "react-dom/client"
import { AnalyticalCardHeader, NumericSideIndicator } from "@/components/ui/analytical-card-header"
import { Card } from "@/components/ui/card"
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu"

function OwnershipFixture() {
  const [headerActions, setHeaderActions] = useState(0)
  const [menuActions, setMenuActions] = useState(0)

  return <main id="analytical-card-header-ownership" style={{ margin: "2rem", width: "30rem" }}>
    <Card accessibleName="Revenue summary">
      <AnalyticalCardHeader titleText="Revenue" value={120} onClick={() => setHeaderActions(count => count + 1)}>
        <NumericSideIndicator titleText="Target" number={130} />
        <details>
          <summary><span>Breakdown</span></summary>
          <p>Revenue by region</p>
        </details>
        <Menu>
          <MenuTrigger>Actions</MenuTrigger>
          <MenuContent>
            <MenuItem onSelect={() => setMenuActions(count => count + 1)}>Export</MenuItem>
          </MenuContent>
        </Menu>
      </AnalyticalCardHeader>
    </Card>
    <output aria-label="Header activations">{headerActions}</output>
    <output aria-label="Menu selections">{menuActions}</output>
  </main>
}

createRoot(document.getElementById("root")!).render(<OwnershipFixture />)
