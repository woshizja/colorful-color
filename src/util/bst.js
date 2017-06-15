class Node {
	constructor(data, left, right) {
		this.data = data;
		this.left = left;
		this.right = right;
	}
	getData() {
		return this.data;
	}
}

class BST {
	constructor() {
		this.root = null;
	}
	insert(data) {
		var newNode = new Node(data, null, null);
		if (!this.root) {
			this.root = newNode;
			return;
		}
		var curNode = this.root;
		var parent;
		while (true) {
			parent = curNode;
			if (data.key < parent.data.key) {
				curNode = curNode.left;
				if (!curNode) {
					parent.left = newNode;
					break;
				}
			} else if(data.key === parent.data.key){
				parent.data.fre++;
				break;
			} else {
				curNode = curNode.right;
				if (!curNode) {
					parent.right = newNode;
					break;
				}
			}
		}
	}
}

function bstTraverse() {
	var res = [];
	var dlrOrder = function(node) {
		if (node) {
			res.push(node.getData()); // 前序遍历
			dlrOrder(node.left);
			dlrOrder(node.right);
		}
	};
	var dlrOrderNoR = function(node) {
		var queue = []; // 前序遍历(非递归)
		var _node = node;
		while(_node || queue.length>0){
			res.push(_node.getData());
			queue.unshift(_node);
			_node = _node.left;
			while(!_node&&queue.length>0){
				_node = queue.shift();
				_node = _node.right;
			}
		}
	};
	var ldrOrder = function(node) {
		if (node) {
			ldrOrder(node.left); // 中序遍历，从小到大
			res.push(node.getData()); 
			ldrOrder(node.right);
		}
	};
	var ldrOrderNoR = function(node) {
		var queue = []; // // 中序遍历(非递归)，从小到大
		var _node = node;
    while(_node || queue.length>0){
      if(_node.left){
        queue.unshift(_node);
        _node = _node.left;
      }else{
        res.push(_node.getData());
        _node = _node.right;
        while(!_node&&queue.length>0){
          _node = queue.shift();
          res.push(_node.getData());
          _node = _node.right;
        }
      }
    }
	};
	var lrdOrder = function(node) {
		if (node) {
			lrdOrder(node.left); // 后序遍历
			lrdOrder(node.right);
			res.push(node.getData()); 
		}
	};
	var levelOrder = function(node) {
		var queue = [];  // 层序遍历
		var _node = node;
		while(_node){
			res.push(_node.getData());
			if(_node.left){
				queue.push(_node.left);
			}
			if(_node.right){
				queue.push(_node.right);
			}
			_node = queue.shift();
		}
	};
	var getRes = function() {
		return res;
	};
	return {
		dlrOrder: dlrOrder,
		dlrOrderNoR: dlrOrderNoR,
		ldrOrder: ldrOrder,
		ldrOrderNoR: ldrOrderNoR,
		lrdOrder: lrdOrder,
		levelOrder: levelOrder,
		getRes: getRes
	};
}

export {
	BST,
	bstTraverse
}