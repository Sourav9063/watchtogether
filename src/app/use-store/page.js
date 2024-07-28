import GlobalStore from "@/components/Provider/Store";
import Child, {
  Button,
  Button2,
  Child2,
  Child3,
  H1,
} from "@/components/use-store/child";

export default function Personal() {
  return (
    <div>
      <GlobalStore storeKey={"GLOBAL"} value={{ count: 0 }}>
        <Child />
        <Button />

        <GlobalStore storeKey={"ANOTHER"} value={{ another: 0 }}>
          <Child2 />
          <h1>hola</h1>
          <H1>h3</H1>
          <Button2 />
        </GlobalStore>

        <GlobalStore storeKey={"ANOTHER"} value={{ another: 0 }}>
          <Child2 />
          <h1>holaaaa</h1>
          <H1>h3</H1>
          <Button2 />
          <Child3 />
        </GlobalStore>
      </GlobalStore>
    </div>
  );
}
