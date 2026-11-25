"use client";

import type { KeyboardEvent } from "react";
import { dadliFlavors, posterUrl } from "@/lib/showcase";
import styles from "./flavor-selector.module.css";

export function FlavorSelector({
  selected,
  onSelect,
  onKeyDown,
}: {
  selected: number;
  onSelect: (index: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
}) {
  return (
    <div
      className={styles.options}
      role="tablist"
      aria-label="انتخاب طعم دادلی"
    >
      {dadliFlavors.map((flavor, index) => (
        <button
          key={flavor.id}
          type="button"
          id={`flavor-tab-${index}`}
          role="tab"
          aria-label={flavor.name}
          title={flavor.name}
          aria-selected={index === selected}
          aria-controls="flavor-panel"
          tabIndex={index === selected ? 0 : -1}
          className={styles.option}
          onClick={() => onSelect(index)}
          onKeyDown={(event) => onKeyDown(event, index)}
        >
          <img
            src={posterUrl(`dadli-${flavor.id}`)}
            alt=""
            width={72}
            height={90}
          />
        </button>
      ))}
    </div>
  );
}
