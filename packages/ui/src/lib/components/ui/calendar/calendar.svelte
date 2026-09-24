<script lang="ts">
import { type DateValue, isEqualMonth } from "@internationalized/date";
import { cn, type WithoutChildrenOrChild } from "@ui-utils";
import { Calendar as CalendarPrimitive } from "bits-ui";
import type { Snippet } from "svelte";
import type { ButtonVariant } from "../button/button.svelte";
import * as Calendar from "./index.js";

let {
  ref = $bindable(null),
  value = $bindable(),
  placeholder = $bindable(),
  class: className,
  weekdayFormat = "short",
  buttonVariant = "ghost",
  navButtonClass,
  captionLayout = "label",
  locale = "en-US",
  months: monthsProp,
  years,
  monthFormat: monthFormatProp,
  yearFormat = "numeric",
  day,
  disableDaysOutsideMonth = false,
  ...restProps
}: WithoutChildrenOrChild<CalendarPrimitive.RootProps> & {
  buttonVariant?: ButtonVariant;
  navButtonClass?: string;
  captionLayout?: "dropdown" | "dropdown-months" | "dropdown-years" | "label";
  months?: CalendarPrimitive.MonthSelectProps["months"];
  years?: CalendarPrimitive.YearSelectProps["years"];
  monthFormat?: CalendarPrimitive.MonthSelectProps["monthFormat"];
  yearFormat?: CalendarPrimitive.YearSelectProps["yearFormat"];
  day?: Snippet<[{ day: DateValue; outsideMonth: boolean }]>;
} = $props();

const monthFormat = $derived.by(() => {
  if (monthFormatProp) return monthFormatProp;
  if (captionLayout.startsWith("dropdown")) return "short";
  return "long";
});
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<CalendarPrimitive.Root
  bind:value={value as never}
  bind:ref
  bind:placeholder
  {weekdayFormat}
  {disableDaysOutsideMonth}
  class={cn(
    "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
    className,
  )}
  {locale}
  {monthFormat}
  {yearFormat}
  {...restProps}>
  {#snippet children({ months, weekdays })}
    <Calendar.Months class="w-full">
      <Calendar.Nav class="z-10 pointer-events-none">
        <Calendar.PrevButton
          variant={buttonVariant}
          class={cn("pointer-events-auto cursor-pointer", navButtonClass)}
        />
        <Calendar.NextButton
          variant={buttonVariant}
          class={cn("pointer-events-auto cursor-pointer", navButtonClass)}
        />
      </Calendar.Nav>
      {#each months as month, monthIndex (month)}
        <Calendar.Month class="w-full">
          <Calendar.Header>
            <Calendar.Caption
              {captionLayout}
              months={monthsProp}
              {monthFormat}
              {years}
              {yearFormat}
              month={month.value}
              bind:placeholder
              {locale}
              {monthIndex} />
          </Calendar.Header>
          <Calendar.Grid class="w-full">
            <Calendar.GridHead class="w-full">
              <Calendar.GridRow class="select-none w-full justify-between">
                {#each weekdays as weekday (weekday)}
                  <Calendar.HeadCell class="flex-1 w-auto text-xs uppercase font-medium"
                    >{weekday.slice(0, 3).toUpperCase()}</Calendar.HeadCell
                  >
                {/each}
              </Calendar.GridRow>
            </Calendar.GridHead>
            <Calendar.GridBody class="w-full">
              {#each month.weeks as weekDates (weekDates)}
                <Calendar.GridRow class="mt-2 w-full justify-between">
                  {#each weekDates as date (date)}
                    <Calendar.Cell {date} month={month.value} class="flex-1 size-auto">
                      {#if day}
                        {@render day({
                          day: date,
                          outsideMonth: !isEqualMonth(date, month.value),
                        })}
                      {:else}
                        <Calendar.Day class="w-full" />
                      {/if}
                    </Calendar.Cell>
                  {/each}
                </Calendar.GridRow>
              {/each}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar.Month>
      {/each}
    </Calendar.Months>
  {/snippet}
</CalendarPrimitive.Root>
