import * as React from "react";
import { styled } from "../../../libraries/styles";

const Wrapper = styled("div", {});

const PADDING = 16;

const TabLabels = styled("div", {
  background: "white",
  padding: PADDING,
  display: "flex",
  position: "relative",
});
const TabHeader = styled("div", {
  margin: 16,
  cursor: "pointer",
});
const Tab = styled("div", {
  display: "none",

  variants: {
    selected: {
      true: {
        display: "block",
      },
    },
  },
});

const TabSlider = styled("div", {
  borderWidth: 2,
  borderTopStyle: "solid",
  borderColor: "#3f4246",

  position: "absolute",
  bottom: PADDING,
  transition: "all 0.2s linear",
});

type TabProps = {
  id: string;
  label: React.ReactNode;
  node: React.ReactNode;
};

type Props = {
  initialSelectedId?: string;
  tabs: TabProps[];
};

export const Tabs: React.FC<Props> = React.memo((props) => {
  const [selectedId, setSelectedId] = React.useState(
    props.initialSelectedId || props.tabs[0].id
  );
  const labelsElementRef = React.useRef<HTMLDivElement>(null);
  const labelsRecordRef = React.useRef<Record<string, HTMLDivElement | null>>(
    {}
  );
  const [sliderPosition, setSliderPosition] = React.useState<{
    left: number;
    width: number;
  }>({
    left: 0,
    width: 0,
  });
  React.useEffect(() => {
    const selectedLabelRef = labelsRecordRef.current[selectedId];
    if (!selectedLabelRef) {
      return;
    }
    setSliderPosition({
      width: selectedLabelRef.offsetWidth,
      left: selectedLabelRef.offsetLeft,
    });
  }, [selectedId]);

  return (
    <Wrapper>
      <TabLabels ref={labelsElementRef}>
        {props.tabs.map(({ label, id }) => (
          <TabHeader
            key={id}
            onClick={() => setSelectedId(id)}
            ref={(element) => (labelsRecordRef.current[id] = element)}
          >
            {label}
          </TabHeader>
        ))}
        <TabSlider style={sliderPosition} />
      </TabLabels>
      {props.tabs.map(({ node, id }) => {
        return (
          <Tab key={id} selected={id === selectedId}>
            {node}
          </Tab>
        );
      })}
    </Wrapper>
  );
});
