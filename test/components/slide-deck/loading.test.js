import Component from "components/slide-deck/loading";
import ComponentHandler from "support/component-handler";

describe("Loading", () => {
  let props;

  beforeEach(() => {
    props = {
      retry: jest.fn().mockName("retry"),
      translate: jest.fn().mockName("translate").mockImplementation((value) => value)
    };
  });

  it("renders component", () => {
    const component = new ComponentHandler(<Component {...props} />);

    expect(component.tree).toMatchSnapshot();
  });

  it("renders retry button if error", () => {
    props.error = "Oh no";
    const component = new ComponentHandler(<Component {...props} />);

    expect(component.tree).toMatchSnapshot();
  });
});
